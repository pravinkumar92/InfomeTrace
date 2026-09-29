from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.database import db
from app.models import (
    RecallActionRequest, RecallActionResponse, RecallActionSummary,
    RecallVerificationResponse, RecallVerificationStatus
)
import uuid

router = APIRouter()

@router.post("/api/recall/action", response_model=RecallActionResponse)
async def create_recall_action(request: RecallActionRequest):
    """
    Record a recall action (disposal, notification, inspection, test).
    Creates audit trail for regulatory compliance.
    """
    
    action_id = f"RA_{request.batch_id}_{str(uuid.uuid4())[:8]}"
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Build the CREATE query dynamically based on action type
    properties = {
        "id": action_id,
        "action_type": request.action_type,
        "batch_id": request.batch_id,
        "performed_by": request.performed_by,
        "performed_at": timestamp,
        "status": "COMPLETED",
        "notes": request.notes or ""
    }
    
    # Add type-specific properties
    if request.action_type == "INVENTORY_DISPOSAL":
        if not request.inventory_id or not request.kitchen_id or not request.quantity_disposed:
            raise HTTPException(status_code=400, detail="INVENTORY_DISPOSAL requires inventory_id, kitchen_id, and quantity_disposed")
        properties.update({
            "inventory_id": request.inventory_id,
            "kitchen_id": request.kitchen_id,
            "quantity_disposed": request.quantity_disposed,
            "unit": request.unit or "kg",
            "disposal_method": request.disposal_method or "Standard disposal",
            "disposal_receipt_id": request.disposal_receipt_id or f"DISP-{timestamp[:10]}-{action_id[-4:]}"
        })
    
    elif request.action_type == "CUSTOMER_NOTIFICATION":
        if not request.customer_id:
            raise HTTPException(status_code=400, detail="CUSTOMER_NOTIFICATION requires customer_id")
        properties.update({
            "customer_id": request.customer_id,
            "notification_method": request.notification_method or "Email + SMS",
            "notification_content": request.notification_content or "Food safety recall notification",
            "acknowledged_by_customer": False,
            "status": "PENDING_ACKNOWLEDGMENT"
        })
    
    elif request.action_type == "VERIFICATION_TEST":
        if not request.test_type:
            raise HTTPException(status_code=400, detail="VERIFICATION_TEST requires test_type")
        properties.update({
            "test_type": request.test_type,
            "test_lab": request.test_lab or "Internal Lab",
            "test_result": request.test_result or "PENDING",
            "test_report_id": request.test_report_id
        })
        if request.supplier_id:
            properties["supplier_id"] = request.supplier_id
    
    elif request.action_type == "FACILITY_INSPECTION":
        if not request.supplier_id:
            raise HTTPException(status_code=400, detail="FACILITY_INSPECTION requires supplier_id")
        properties.update({
            "supplier_id": request.supplier_id,
            "inspection_result": request.inspection_result or "PENDING",
            "contamination_source": request.contamination_source,
            "corrective_action_required": request.corrective_action_required
        })
    
    elif request.action_type == "SUPPLIER_NOTIFICATION":
        if not request.supplier_id:
            raise HTTPException(status_code=400, detail="SUPPLIER_NOTIFICATION requires supplier_id")
        properties.update({
            "supplier_id": request.supplier_id,
            "notification_method": request.notification_method or "Official Letter"
        })
    
    # Build property string for Cypher
    prop_str = ", ".join([f"ra.{k} = ${k}" for k in properties.keys()])
    
    query = f"""
    CREATE (ra:RecallAction)
    SET {prop_str}
    WITH ra
    MATCH (b:Batch {{id: $batch_id}})
    MERGE (ra)-[:ACTION_FOR_RECALL]->(b)
    RETURN ra
    """
    
    with db.driver.session() as session:
        result = session.run(query, properties)
        record = result.single()
        
        if not record:
            raise HTTPException(status_code=500, detail="Failed to create recall action")
        
        action_node = dict(record["ra"])
        
        # Create relationships based on action type
        if request.action_type == "INVENTORY_DISPOSAL":
            session.run(
                """
                MATCH (ra:RecallAction {id: $action_id}), (inv:Inventory {id: $inventory_id})
                MERGE (ra)-[:DISPOSED]->(inv)
                """,
                {"action_id": action_id, "inventory_id": request.inventory_id}
            )
            session.run(
                """
                MATCH (ra:RecallAction {id: $action_id}), (k:Kitchen {id: $kitchen_id})
                MERGE (ra)-[:PERFORMED_AT_KITCHEN]->(k)
                """,
                {"action_id": action_id, "kitchen_id": request.kitchen_id}
            )
        
        elif request.action_type == "CUSTOMER_NOTIFICATION":
            session.run(
                """
                MATCH (ra:RecallAction {id: $action_id}), (c:Customer {id: $customer_id})
                MERGE (ra)-[:NOTIFIED]->(c)
                """,
                {"action_id": action_id, "customer_id": request.customer_id}
            )
        
        elif request.action_type in ["FACILITY_INSPECTION", "SUPPLIER_NOTIFICATION", "VERIFICATION_TEST"]:
            if request.supplier_id:
                session.run(
                    """
                    MATCH (ra:RecallAction {id: $action_id}), (s:Supplier {id: $supplier_id})
                    MERGE (ra)-[:INVOLVED_SUPPLIER]->(s)
                    """,
                    {"action_id": action_id, "supplier_id": request.supplier_id}
                )
        
        action_summary = RecallActionSummary(
            id=action_node["id"],
            action_type=action_node["action_type"],
            batch_id=action_node["batch_id"],
            performed_by=action_node["performed_by"],
            performed_at=action_node["performed_at"],
            verified_by=action_node.get("verified_by"),
            verified_at=action_node.get("verified_at"),
            status=action_node["status"],
            notes=action_node.get("notes"),
            details={k: v for k, v in action_node.items() if k not in ["id", "action_type", "batch_id", "performed_by", "performed_at", "status", "notes"]}
        )
        
        return RecallActionResponse(
            success=True,
            action_id=action_id,
            action=action_summary,
            cypher=query,
            parameters=properties
        )


@router.get("/api/recall/verify/{batch_id}", response_model=RecallVerificationResponse)
async def verify_recall_completion(batch_id: str):
    """
    Verify recall completion status for a batch.
    Checks disposal, notifications, and inspections.
    Returns compliance status for regulatory reporting.
    """
    
    # Query 1: Get verification status summary
    status_query = """
    MATCH (b:Batch {id: $batch_id})
    OPTIONAL MATCH (ra:RecallAction)-[:ACTION_FOR_RECALL]->(b)
    WITH b, 
         collect(ra) AS all_actions,
         count(DISTINCT CASE WHEN ra.action_type = 'INVENTORY_DISPOSAL' AND ra.status = 'COMPLETED' THEN ra END) AS disposals_completed,
         count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' AND ra.status = 'COMPLETED' THEN ra END) AS notifications_completed,
         count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' THEN ra END) AS notifications_total,
         count(DISTINCT CASE WHEN ra.action_type = 'FACILITY_INSPECTION' AND ra.status = 'COMPLETED' THEN ra END) AS inspections_completed
    WITH b, disposals_completed, notifications_completed, notifications_total, inspections_completed, all_actions,
         size([a IN all_actions WHERE a.action_type IN ['INVENTORY_DISPOSAL', 'CUSTOMER_NOTIFICATION', 'FACILITY_INSPECTION']]) AS total_actions,
         size([a IN all_actions WHERE a.status = 'COMPLETED' AND a.action_type IN ['INVENTORY_DISPOSAL', 'CUSTOMER_NOTIFICATION', 'FACILITY_INSPECTION']]) AS completed_actions
    RETURN b.id AS batch_id,
           b.status AS batch_status,
           b.recalled_at AS recall_date,
           disposals_completed,
           notifications_completed,
           notifications_total,
           inspections_completed,
           CASE 
             WHEN b.status = 'RECALLED' AND disposals_completed >= 2 AND notifications_completed >= (notifications_total * 0.8) AND inspections_completed >= 1 
             THEN 'RECALL_VERIFIED_COMPLETE'
             ELSE 'RECALL_IN_PROGRESS'
           END AS verification_status,
           CASE 
             WHEN total_actions > 0 THEN round(100.0 * completed_actions / total_actions, 2)
             ELSE 0.0
           END AS completion_percentage
    """
    
    # Query 2: Get completed actions
    completed_actions_query = """
    MATCH (b:Batch {id: $batch_id})<-[:ACTION_FOR_RECALL]-(ra:RecallAction)
    WHERE ra.status = 'COMPLETED'
    RETURN ra
    ORDER BY ra.performed_at DESC
    """
    
    # Query 3: Get pending actions
    pending_actions_query = """
    MATCH (b:Batch {id: $batch_id})<-[:ACTION_FOR_RECALL]-(ra:RecallAction)
    WHERE ra.status IN ['PENDING', 'PENDING_ACKNOWLEDGMENT', 'IN_PROGRESS']
    RETURN ra
    ORDER BY ra.performed_at
    """
    
    # Query 4: Disposal verification
    disposal_query = """
    MATCH (b:Batch {id: $batch_id})
    OPTIONAL MATCH (inv:Inventory)-[:SOURCED_FROM]->(b)
    OPTIONAL MATCH (ra_disposal:RecallAction {action_type: 'INVENTORY_DISPOSAL'})-[:DISPOSED]->(inv)
    WITH b, 
         sum(inv.remaining_quantity) AS total_contaminated_kg,
         sum(CASE WHEN ra_disposal.status = 'COMPLETED' THEN ra_disposal.quantity_disposed ELSE 0 END) AS total_disposed_kg
    RETURN total_contaminated_kg,
           total_disposed_kg,
           CASE 
             WHEN total_disposed_kg >= total_contaminated_kg THEN 'FULL_DISPOSAL_VERIFIED'
             WHEN total_disposed_kg > 0 THEN 'PARTIAL_DISPOSAL'
             ELSE 'NO_DISPOSAL_RECORDED'
           END AS disposal_status,
           CASE 
             WHEN total_contaminated_kg > 0 THEN round(100.0 * total_disposed_kg / total_contaminated_kg, 2)
             ELSE 0.0
           END AS disposal_percentage
    """
    
    with db.driver.session() as session:
        # Execute queries
        status_result = session.run(status_query, {"batch_id": batch_id}).single()
        if not status_result:
            raise HTTPException(status_code=404, detail=f"Batch not found: {batch_id}")
        
        completed_results = list(session.run(completed_actions_query, {"batch_id": batch_id}))
        pending_results = list(session.run(pending_actions_query, {"batch_id": batch_id}))
        disposal_result = session.run(disposal_query, {"batch_id": batch_id}).single()
        
        # Build response
        verification_status = RecallVerificationStatus(
            batch_id=status_result["batch_id"],
            batch_status=status_result["batch_status"],
            recall_date=status_result.get("recall_date", "Not recalled"),
            inventory_disposed=status_result["disposals_completed"],
            customer_notifications_completed=status_result["notifications_completed"],
            customer_notifications_total=status_result["notifications_total"],
            facility_inspections=status_result["inspections_completed"],
            verification_status=status_result["verification_status"],
            completion_percentage=status_result["completion_percentage"]
        )
        
        actions_completed = [
            RecallActionSummary(
                id=record["ra"]["id"],
                action_type=record["ra"]["action_type"],
                batch_id=record["ra"]["batch_id"],
                performed_by=record["ra"]["performed_by"],
                performed_at=record["ra"]["performed_at"],
                verified_by=record["ra"].get("verified_by"),
                verified_at=record["ra"].get("verified_at"),
                status=record["ra"]["status"],
                notes=record["ra"].get("notes")
            )
            for record in completed_results
        ]
        
        actions_pending = [
            RecallActionSummary(
                id=record["ra"]["id"],
                action_type=record["ra"]["action_type"],
                batch_id=record["ra"]["batch_id"],
                performed_by=record["ra"]["performed_by"],
                performed_at=record["ra"]["performed_at"],
                status=record["ra"]["status"],
                notes=record["ra"].get("notes")
            )
            for record in pending_results
        ]
        
        disposal_verification = {
            "total_contaminated_kg": disposal_result["total_contaminated_kg"],
            "total_disposed_kg": disposal_result["total_disposed_kg"],
            "disposal_status": disposal_result["disposal_status"],
            "disposal_percentage": disposal_result["disposal_percentage"]
        }
        
        return RecallVerificationResponse(
            success=True,
            batch_id=batch_id,
            verification_status=verification_status,
            actions_completed=actions_completed,
            actions_pending=actions_pending,
            disposal_verification=disposal_verification,
            cypher=f"{status_query}\n---\n{disposal_query}"
        )


@router.post("/api/recall/action/{action_id}/acknowledge")
async def acknowledge_customer_notification(action_id: str):
    """
    Mark a customer notification as acknowledged.
    Called when customer confirms receipt of recall notice.
    """
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    query = """
    MATCH (ra:RecallAction {id: $action_id, action_type: 'CUSTOMER_NOTIFICATION'})
    SET ra.acknowledged_by_customer = true,
        ra.acknowledged_at = $timestamp,
        ra.status = 'COMPLETED'
    RETURN ra.id AS action_id, ra.customer_id AS customer_id, ra.status AS new_status
    """
    
    with db.driver.session() as session:
        result = session.run(query, {"action_id": action_id, "timestamp": timestamp})
        record = result.single()
        
        if not record:
            raise HTTPException(status_code=404, detail=f"Customer notification action not found: {action_id}")
        
        return {
            "success": True,
            "action_id": record["action_id"],
            "customer_id": record["customer_id"],
            "new_status": record["new_status"],
            "acknowledged_at": timestamp,
            "cypher": query
        }
