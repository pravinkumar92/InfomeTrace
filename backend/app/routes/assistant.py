from fastapi import APIRouter, HTTPException
import json
from google import genai
from google.genai import types
from app.models import TraceAssistRequest, TraceAssistResponse
from app.database import get_driver, settings
from app.routes.investigation import (
    TRACE_ORDER_CYPHER, 
    TRACE_CUSTOMER_CYPHER,
    SIMULATE_REMAINING_CYPHER,
    extract_scope
)

router = APIRouter()

SYSTEM_PROMPT = """You are InfoMeTrace Trace Assist, the AI investigation assistant for InfoMeTrace — a graph-powered food safety intelligence platform.

**Your Role:**
You provide actionable intelligence for food safety incidents by analyzing the live Neo4j knowledge graph. You help incident commanders understand:
- Contamination exposure paths and impact scope
- Status of batches, inventory, and dishes throughout the recall lifecycle
- Recall verification progress and compliance status
- Quantity-aware inventory tracking (received/consumed/remaining at each kitchen)
- Recipe-level ingredient consumption for precise exposure calculation

**Core Capabilities:**
1. **Traceability Analysis**: Trace contamination forward (supplier→batch→kitchen→dish→order→customer) and backward (customer→order→dish→kitchen→batch→supplier)
2. **Impact Assessment**: Calculate affected kitchens, dishes, orders, and customers with precision
3. **Status Monitoring**: Track entity lifecycle states (SAFE→FLAGGED→QUARANTINED→RECALLED/VERIFIED for batches/inventory, AVAILABLE→SUSPENDED for dishes)
4. **Recall Operations**: Guide disposal, customer notifications, supplier investigations, and verification testing
5. **Containment Simulation**: Analyze "what-if" scenarios for surgical containment at specific kitchens

**Operational Rules:**
- Answer ONLY from the structured investigation context supplied by the InfoMeTrace backend
- Never invent entities, relationships, counts, dates, or status values
- If context is insufficient, acknowledge the gap and suggest what data is needed
- Do not provide generic supply-chain advice — focus on THIS investigation's live graph data
- Explain graph relationships clearly using entity IDs and types
- For status questions, always check the "status_tracking" context if available
- For recall questions, reference "recall_verification" data for compliance metrics
- For quantity questions, cite "inventory_details" with specific kg/liter amounts

**Response Style:**
- Concise, operational, command-center appropriate
- Lead with critical facts (contamination status, recall state, affected count)
- Use specific entity IDs and quantities when available
- Structure multi-part answers with clear sections
- Flag urgent issues (e.g., RECALLED status, disposal pending, notifications incomplete)

**Context Structure:**
The backend provides structured JSON with:
- investigation_type & investigation_id: Entry point for this query
- root_cause_path: Traceability chain from this entity
- impact_counts: Downstream affected entities
- recall: Status and verification data
- simulation: Containment scenario results (if active)
- status_tracking: Lifecycle state and timestamps (if available)
- inventory_details: Quantity tracking per kitchen (if available)
- recall_verification: Action completion status (if available)"""

DOWNSTREAM_CYPHER = """
MATCH (b:Batch {id: $batch_id})
OPTIONAL MATCH (b)-[:DELIVERED_TO]->(k:Kitchen)
OPTIONAL MATCH (k)-[:USED_IN]->(d:Dish)
OPTIONAL MATCH (d)<-[:ORDERED_AS]-(o:Order)
OPTIONAL MATCH (o)-[:PLACED_BY]->(c:Customer)
RETURN b, k, d, o, c
"""

@router.post("/api/assistant/chat", response_model=TraceAssistResponse)
def trace_assist_chat(request: TraceAssistRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    e_type = request.entity_type.strip()
    e_id = request.entity_id.strip()
    
    context = {
        "investigation_type": e_type,
        "investigation_id": e_id,
        "root_cause_path": [],
        "impact_counts": {},
        "recall": {},
        "simulation": None,
        "status_tracking": {},
        "inventory_details": [],
        "recall_verification": None
    }
    
    with driver.session(database=settings.neo4j_database) as session:
        batch_id = None
        
        # 1. Reverse Trace Context
        if e_type in ["Order", "Customer"]:
            cypher = TRACE_ORDER_CYPHER if e_type == "Order" else TRACE_CUSTOMER_CYPHER
            result = session.run(cypher, entity_id=e_id)
            records = list(result)
            if records:
                record = records[0]
                b_node = record.get("b")
                
                path_labels = []
                if record.get("c"): path_labels.append(f"Customer {record['c']['id']}")
                if record.get("o"): path_labels.append(f"Order {record['o']['id']}")
                if record.get("d"): path_labels.append(f"Dish {record['d']['id']}")
                if record.get("k"): path_labels.append(f"Kitchen {record['k']['id']}")
                if b_node: 
                    path_labels.append(f"Batch {b_node['id']}")
                    batch_id = b_node["id"]
                if record.get("s"): path_labels.append(f"Supplier {record['s']['id']}")
                
                context["root_cause_path"] = path_labels
                
        elif e_type == "Batch":
            batch_id = e_id
            # Get supplier for batch investigations
            supplier_result = session.run(
                "MATCH (s:Supplier)-[:SUPPLIES]->(b:Batch {id: $b_id}) RETURN s, b",
                b_id=batch_id
            ).single()
            if supplier_result:
                s_node = supplier_result.get("s")
                b_node = supplier_result.get("b")
                if s_node and b_node:
                    context["root_cause_path"] = [
                        f"Supplier {s_node['id']} ({s_node.get('name', 'Unknown')})",
                        f"Batch {b_node['id']} ({b_node.get('ingredient', 'Unknown')})"
                    ]
            
        # 2. Downstream Context & Recall
        if batch_id:
            # Get batch with full status tracking
            batch_result = session.run("""
                MATCH (b:Batch {id: $b_id}) 
                RETURN b.id as id, 
                       b.status as status, 
                       b.ingredient as ingredient,
                       b.status_updated_at as status_updated_at,
                       b.status_reason as status_reason,
                       b.recalled_at as recalled_at
            """, b_id=batch_id).single()
            
            if batch_result:
                context["recall"] = {
                    "batch_id": batch_result["id"],
                    "ingredient": batch_result["ingredient"],
                    "status": batch_result["status"],
                    "status_updated_at": batch_result.get("status_updated_at"),
                    "status_reason": batch_result.get("status_reason"),
                    "recalled_at": batch_result.get("recalled_at"),
                    "verified_from_live_graph": True
                }
                
                # Get status tracking for related entities
                status_query = """
                MATCH (b:Batch {id: $b_id})
                OPTIONAL MATCH (inv:Inventory)-[:SOURCED_FROM]->(b)
                OPTIONAL MATCH (b)-[:CONTAINS_INGREDIENT]->(i:Ingredient)
                OPTIONAL MATCH (d:Dish)-[:HAS_RECIPE]->(:Recipe)-[:REQUIRES]->(i)
                RETURN collect(DISTINCT {
                    type: 'inventory',
                    id: inv.id,
                    status: inv.status,
                    remaining_kg: inv.remaining_quantity
                }) as inventory_statuses,
                collect(DISTINCT {
                    type: 'dish',
                    id: d.id,
                    name: d.name,
                    status: d.status,
                    status_reason: d.status_reason
                }) as dish_statuses
                """
                status_data = session.run(status_query, b_id=batch_id).single()
                
                if status_data:
                    inv_statuses = [s for s in status_data["inventory_statuses"] if s.get("id")]
                    dish_statuses = [s for s in status_data["dish_statuses"] if s.get("id")]
                    
                    context["status_tracking"] = {
                        "inventory_items": len(inv_statuses),
                        "recalled_inventory": len([s for s in inv_statuses if s.get("status") == "RECALLED"]),
                        "remaining_contaminated_kg": sum(s.get("remaining_kg", 0) for s in inv_statuses if s.get("status") in ["RECALLED", "QUARANTINED"]),
                        "dishes_total": len(dish_statuses),
                        "dishes_suspended": len([s for s in dish_statuses if s.get("status") == "SUSPENDED"]),
                        "details": {
                            "inventory": inv_statuses[:5],  # Limit to 5 for context size
                            "dishes": dish_statuses[:5]
                        }
                    }
                
                # Get inventory quantity details
                inventory_query = """
                MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: $b_id})
                MATCH (inv)<-[:HAS_INVENTORY]-(k:Kitchen)
                RETURN inv.id as id,
                       k.id as kitchen_id,
                       k.name as kitchen_name,
                       inv.received_quantity as received,
                       inv.consumed_quantity as consumed,
                       inv.remaining_quantity as remaining,
                       inv.unit as unit,
                       inv.status as status
                ORDER BY inv.remaining_quantity DESC
                LIMIT 10
                """
                inventory_data = list(session.run(inventory_query, b_id=batch_id))
                
                context["inventory_details"] = [
                    {
                        "inventory_id": rec["id"],
                        "kitchen": f"{rec['kitchen_id']} ({rec['kitchen_name']})",
                        "received": f"{rec['received']} {rec['unit']}",
                        "consumed": f"{rec['consumed']} {rec['unit']}",
                        "remaining": f"{rec['remaining']} {rec['unit']}",
                        "status": rec["status"]
                    }
                    for rec in inventory_data
                ]
                
                # Try to get recall verification status if batch is recalled
                if batch_result["status"] == "RECALLED":
                    try:
                        verification_query = """
                        MATCH (b:Batch {id: $b_id})
                        OPTIONAL MATCH (ra:RecallAction)-[:ACTION_FOR_RECALL]->(b)
                        RETURN count(DISTINCT CASE WHEN ra.action_type = 'INVENTORY_DISPOSAL' AND ra.status = 'COMPLETED' THEN ra END) as disposals_completed,
                               count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' AND ra.status = 'COMPLETED' THEN ra END) as notifications_completed,
                               count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' THEN ra END) as notifications_total,
                               count(DISTINCT CASE WHEN ra.action_type = 'FACILITY_INSPECTION' AND ra.status = 'COMPLETED' THEN ra END) as inspections_completed
                        """
                        verification_data = session.run(verification_query, b_id=batch_id).single()
                        
                        if verification_data and verification_data["notifications_total"] > 0:
                            context["recall_verification"] = {
                                "disposals_completed": verification_data["disposals_completed"],
                                "customer_notifications": f"{verification_data['notifications_completed']}/{verification_data['notifications_total']}",
                                "facility_inspections": verification_data["inspections_completed"],
                                "verification_note": "Recall actions are being tracked in the RecallAction audit system"
                            }
                    except Exception:
                        pass  # RecallAction tracking may not be initialized yet
            
            downstream = list(session.run(DOWNSTREAM_CYPHER, batch_id=batch_id))
            if downstream:
                k_dict, d_dict, o_dict, c_dict = {}, {}, {}, {}
                for rec in downstream:
                    k, d, o, c = rec.get("k"), rec.get("d"), rec.get("o"), rec.get("c")
                    if k: k_dict[k["id"]] = k["id"]
                    if d: d_dict[d["id"]] = d["id"]
                    if o: o_dict[o["id"]] = o["id"]
                    if c: c_dict[c["id"]] = c["id"]
                
                context["impact_counts"] = {
                    "kitchens": len(k_dict),
                    "dishes": len(d_dict),
                    "orders": len(o_dict),
                    "customers": len(c_dict)
                }
                
        # 3. Simulation Context
        if batch_id and request.containment_kitchen_id:
            k_id = request.containment_kitchen_id.strip()
            check_cypher = "MATCH (b:Batch {id: $b_id})-[:DELIVERED_TO]->(k:Kitchen {id: $k_id}) RETURN b"
            if session.run(check_cypher, b_id=batch_id, k_id=k_id).single():
                remaining = extract_scope(list(session.run(SIMULATE_REMAINING_CYPHER, batch_id=batch_id, kitchen_id=k_id)))
                context["simulation"] = {
                    "containment_point": f"Kitchen {k_id}",
                    "remaining_impact_counts": {
                        "kitchens": remaining.counts.kitchens,
                        "dishes": remaining.counts.dishes,
                        "orders": remaining.counts.orders,
                        "customers": remaining.counts.customers
                    }
                }

    print(f"[TraceAssist] Processing {e_type} investigation for {e_id}")
    print(f"[TraceAssist] Gemini API Key present: {bool(settings.gemini_api_key)}")
    print(f"[TraceAssist] Gemini Model: {settings.gemini_model}")

    # Generate intelligent mock response based on context
    def generate_mock_response(ctx, question):
        """Generate contextual AI-like response for demo"""
        q_lower = question.lower()
        
        # Extract key info from context
        inv_type = ctx.get("investigation_type", "Unknown")
        inv_id = ctx.get("investigation_id", "Unknown")
        recall = ctx.get("recall", {})
        impacts = ctx.get("impact_counts", {})
        status_tracking = ctx.get("status_tracking", {})
        inventory = ctx.get("inventory_details", [])
        
        # Build response based on question type
        if any(word in q_lower for word in ["status", "what happened", "issue", "problem"]):
            batch_status = recall.get("status", "UNKNOWN")
            ingredient = recall.get("ingredient", "Unknown ingredient")
            
            response = f"**Investigation Summary for {inv_type} {inv_id}:**\n\n"
            response += f"📦 **Batch Status:** {batch_status}\n"
            response += f"🌾 **Ingredient:** {ingredient}\n\n"
            
            if batch_status == "RECALLED":
                response += "⚠️ **CRITICAL:** This batch has been RECALLED due to contamination concerns.\n\n"
            elif batch_status == "FLAGGED":
                response += "⚠️ **WARNING:** This batch has been FLAGGED for investigation.\n\n"
            
            if impacts:
                response += f"**Downstream Impact:**\n"
                if impacts.get("kitchens"): response += f"• {impacts['kitchens']} kitchens affected\n"
                if impacts.get("dishes"): response += f"• {impacts['dishes']} dishes compromised\n"
                if impacts.get("orders"): response += f"• {impacts['orders']} orders containing affected items\n"
                if impacts.get("customers"): response += f"• {impacts['customers']} customers potentially exposed\n"
            
            return response
            
        elif any(word in q_lower for word in ["customer", "who", "affected", "exposed"]):
            customer_count = impacts.get("customers", 0)
            order_count = impacts.get("orders", 0)
            
            response = f"**Customer Exposure Analysis for {inv_type} {inv_id}:**\n\n"
            response += f"👥 **Total Customers Affected:** {customer_count}\n"
            response += f"📋 **Total Orders:** {order_count}\n\n"
            
            if customer_count > 0:
                response += "🚨 **Recommended Actions:**\n"
                response += "• Immediate customer notification required\n"
                response += "• Health monitoring and follow-up calls\n"
                response += "• Refund/replacement processing\n"
                response += "• Document all customer interactions\n"
            else:
                response += "✅ No customer exposure detected in the current investigation scope.\n"
            
            return response
            
        elif any(word in q_lower for word in ["kitchen", "facility", "location"]):
            kitchen_count = impacts.get("kitchens", 0)
            
            response = f"**Kitchen/Facility Analysis for {inv_type} {inv_id}:**\n\n"
            response += f"🏭 **Affected Kitchens:** {kitchen_count}\n\n"
            
            if inventory:
                response += "**Inventory Status by Kitchen:**\n"
                for inv in inventory[:3]:  # Show top 3
                    response += f"\n📍 {inv['kitchen']}\n"
                    response += f"   • Received: {inv['received']}\n"
                    response += f"   • Consumed: {inv['consumed']}\n"
                    response += f"   • Remaining: {inv['remaining']}\n"
                    response += f"   • Status: {inv['status']}\n"
                
                if len(inventory) > 3:
                    response += f"\n... and {len(inventory) - 3} more kitchen(s)\n"
            
            return response
            
        elif any(word in q_lower for word in ["dish", "menu", "recipe"]):
            dish_count = impacts.get("dishes", 0)
            dishes_suspended = status_tracking.get("dishes_suspended", 0)
            
            response = f"**Dish/Menu Impact for {inv_type} {inv_id}:**\n\n"
            response += f"🍽️ **Total Dishes Affected:** {dish_count}\n"
            response += f"⏸️ **Dishes Suspended:** {dishes_suspended}\n\n"
            
            if dishes_suspended > 0:
                response += "**Status:** Menu items using contaminated ingredients have been suspended from service.\n\n"
                response += "**Next Steps:**\n"
                response += "• Replace contaminated inventory\n"
                response += "• Verify ingredient sourcing\n"
                response += "• Resume service after clearance\n"
            
            return response
            
        else:
            # Generic helpful response
            response = f"**Investigation Overview for {inv_type} {inv_id}:**\n\n"
            
            if recall.get("status"):
                response += f"📦 Status: {recall['status']}\n"
            if recall.get("ingredient"):
                response += f"🌾 Ingredient: {recall['ingredient']}\n"
            
            response += f"\n**Impact Scope:**\n"
            for key, value in impacts.items():
                response += f"• {key.title()}: {value}\n"
            
            response += f"\n💡 **Tip:** You can ask me about:\n"
            response += "• 'What happened with this batch?'\n"
            response += "• 'Which customers are affected?'\n"
            response += "• 'What is the kitchen status?'\n"
            response += "• 'Which dishes are compromised?'\n"
            
            return response
    
    # Try Gemini first, fallback to mock if unavailable
    if not settings.gemini_api_key:
        print("[TraceAssist] Using mock response (no API key)")
        return TraceAssistResponse(answer=generate_mock_response(context, request.question))
        
    try:
        print("[TraceAssist] Creating Gemini client...")
        client = genai.Client(api_key=settings.gemini_api_key)
        contents = f"CONTEXT:\n{json.dumps(context, indent=2)}\n\nUSER QUESTION:\n{request.question}"
        
        print("[TraceAssist] Calling Gemini API...")
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2
            )
        )
        print("[TraceAssist] SUCCESS: Response received from Gemini")
        return TraceAssistResponse(answer=response.text.strip())
    except Exception as e:
        print(f"[TraceAssist] GEMINI ERROR: {type(e).__name__}: {str(e)}")
        print("[TraceAssist] Falling back to mock response")
        return TraceAssistResponse(answer=generate_mock_response(context, request.question))

