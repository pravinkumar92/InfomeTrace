from fastapi import APIRouter, HTTPException, status
from app.models import (
    InvestigationRequest, InvestigationResponse, BatchSummary, 
    AffectedKitchen, AffectedDish, AffectedOrder, AffectedCustomer, ImpactSummary,
    RecallRequest, RecallResponse,
    TraceOriginRequest, TraceOriginResponse, TracePathNode, SupplierSummary,
    SimulateContainmentRequest, SimulateContainmentResponse, SimulationScope,
    OrderExplanationRequest, OrderExplanationResponse, ExposurePathNode,
    InventorySummary, RecipeSummary, IngredientSummary
)
from app.database import get_driver, settings
from neo4j.exceptions import ServiceUnavailable

router = APIRouter()

INVESTIGATION_CYPHER = """
MATCH (b:Batch {id: $batch_id})
-[:DELIVERED_TO]->(k:Kitchen)
-[:USED_IN]->(d:Dish)
<-[:ORDERED_AS]-(o:Order)
-[:PLACED_BY]->(c:Customer)
RETURN b, k, d, o, c
"""

BATCH_PROFILE_CYPHER = """
MATCH (b:Batch {id: $batch_id})
RETURN b
"""

@router.post("/api/investigate/batch", response_model=InvestigationResponse)
def investigate_batch(request: InvestigationRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Database connection unavailable"
        )
    
    if not request.batch_id or not request.batch_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="batch_id is required"
        )

    batch_id = request.batch_id.strip()

    try:
        with driver.session(database=settings.neo4j_database) as session:
            # 1. Fetch batch profile to check existence
            batch_result = session.run(BATCH_PROFILE_CYPHER, batch_id=batch_id)
            batch_record = batch_result.single()
            
            if not batch_record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail=f"Batch {batch_id} not found"
                )
            
            b_node = batch_record["b"]
            batch_summary = BatchSummary(
                id=b_node["id"],
                ingredient=b_node["ingredient"],
                quantity=b_node["quantity"],
                received_date=b_node["received_date"],
                expiry_date=b_node["expiry_date"],
                status=b_node["status"]
            )
            
            # 2. Perform traversal
            traversal_result = session.run(INVESTIGATION_CYPHER, batch_id=batch_id)
            
            kitchens_dict = {}
            dishes_dict = {}
            orders_dict = {}
            customers_dict = {}
            
            for record in traversal_result:
                k = record["k"]
                if k["id"] not in kitchens_dict:
                    kitchens_dict[k["id"]] = AffectedKitchen(
                        id=k["id"], name=k["name"], city=k["city"], 
                        location=k["location"], status=k["status"]
                    )
                
                d = record["d"]
                if d["id"] not in dishes_dict:
                    dishes_dict[d["id"]] = AffectedDish(
                        id=d["id"], name=d["name"], category=d["category"], 
                        price=d["price"], status=d["status"]
                    )
                    
                o = record["o"]
                if o["id"] not in orders_dict:
                    orders_dict[o["id"]] = AffectedOrder(
                        id=o["id"], timestamp=o["timestamp"], status=o["status"]
                    )
                    
                c = record["c"]
                if c["id"] not in customers_dict:
                    customers_dict[c["id"]] = AffectedCustomer(
                        id=c["id"], name=c["name"], city=c["city"]
                    )
            
            # 3. Build response
            return InvestigationResponse(
                success=True,
                investigation_type="batch",
                entity_id=batch_id,
                batch=batch_summary,
                kitchens=list(kitchens_dict.values()),
                dishes=list(dishes_dict.values()),
                orders=list(orders_dict.values()),
                customers=list(customers_dict.values()),
                impact=ImpactSummary(
                    kitchens=len(kitchens_dict),
                    dishes=len(dishes_dict),
                    orders=len(orders_dict),
                    customers=len(customers_dict)
                ),
                cypher=INVESTIGATION_CYPHER.strip(),
                parameters={"batch_id": batch_id}
            )
            
    except ServiceUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Failed to communicate with Neo4j database"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An unexpected error occurred during investigation."
        )


# New: Order Investigation
ORDER_INVESTIGATION_CYPHER = """
MATCH (o:Order {id: $order_id})-[:PLACED_BY]->(c:Customer)
OPTIONAL MATCH (o)-[:ORDERED_AS]->(d:Dish)<-[:USED_IN]-(k:Kitchen)<-[:DELIVERED_TO]-(b:Batch)
OPTIONAL MATCH (b)<-[:SUPPLIES]-(s:Supplier)
RETURN o, c, d, k, b, s
"""

@router.post("/api/investigate/order")
def investigate_order(order_id: str = None):
    """Investigate an order and trace its supply chain."""
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id is required")
    
    order_id = order_id.strip()
    
    try:
        with driver.session(database=settings.neo4j_database) as session:
            result = session.run(ORDER_INVESTIGATION_CYPHER, order_id=order_id)
            records = list(result)
            
            if not records:
                raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
            
            # Extract entities
            order_node = records[0]["o"]
            customer_node = records[0]["c"]
            
            batches_dict = {}
            kitchens_dict = {}
            dishes_dict = {}
            suppliers_dict = {}
            
            for record in records:
                d = record.get("d")
                k = record.get("k")
                b = record.get("b")
                s = record.get("s")
                
                if d and d["id"] not in dishes_dict:
                    dishes_dict[d["id"]] = AffectedDish(
                        id=d["id"], name=d["name"], category=d["category"],
                        price=d["price"], status=d["status"]
                    )
                
                if k and k["id"] not in kitchens_dict:
                    kitchens_dict[k["id"]] = AffectedKitchen(
                        id=k["id"], name=k["name"], city=k["city"],
                        location=k["location"], status=k["status"]
                    )
                
                if b and b["id"] not in batches_dict:
                    batches_dict[b["id"]] = BatchSummary(
                        id=b["id"], ingredient=b["ingredient"], quantity=b["quantity"],
                        received_date=b["received_date"], expiry_date=b["expiry_date"],
                        status=b["status"]
                    )
                
                if s and s["id"] not in suppliers_dict:
                    suppliers_dict[s["id"]] = SupplierSummary(
                        id=s["id"], name=s["name"], location=s["location"]
                    )
            
            return {
                "success": True,
                "investigation_type": "order",
                "entity_id": order_id,
                "order": AffectedOrder(
                    id=order_node["id"],
                    timestamp=order_node["timestamp"],
                    status=order_node["status"]
                ),
                "customer": AffectedCustomer(
                    id=customer_node["id"],
                    name=customer_node["name"],
                    city=customer_node["city"]
                ),
                "dishes": list(dishes_dict.values()),
                "kitchens": list(kitchens_dict.values()),
                "batches": list(batches_dict.values()),
                "suppliers": list(suppliers_dict.values()),
                "impact": {
                    "dishes": len(dishes_dict),
                    "kitchens": len(kitchens_dict),
                    "batches": len(batches_dict),
                    "suppliers": len(suppliers_dict)
                },
                "cypher": ORDER_INVESTIGATION_CYPHER.strip(),
                "parameters": {"order_id": order_id}
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Investigation failed")


# New: Customer Investigation
CUSTOMER_INVESTIGATION_CYPHER = """
MATCH (c:Customer {id: $customer_id})
OPTIONAL MATCH (c)<-[:PLACED_BY]-(o:Order)-[:ORDERED_AS]->(d:Dish)
OPTIONAL MATCH (d)<-[:USED_IN]-(k:Kitchen)<-[:DELIVERED_TO]-(b:Batch)
OPTIONAL MATCH (b)<-[:SUPPLIES]-(s:Supplier)
RETURN c, o, d, k, b, s
"""

@router.post("/api/investigate/customer")
def investigate_customer(customer_id: str = None):
    """Investigate a customer and trace all their orders."""
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    if not customer_id:
        raise HTTPException(status_code=400, detail="customer_id is required")
    
    customer_id = customer_id.strip()
    
    try:
        with driver.session(database=settings.neo4j_database) as session:
            result = session.run(CUSTOMER_INVESTIGATION_CYPHER, customer_id=customer_id)
            records = list(result)
            
            if not records:
                raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
            
            # Extract entities
            customer_node = records[0]["c"]
            
            orders_dict = {}
            dishes_dict = {}
            kitchens_dict = {}
            batches_dict = {}
            suppliers_dict = {}
            
            for record in records:
                o = record.get("o")
                d = record.get("d")
                k = record.get("k")
                b = record.get("b")
                s = record.get("s")
                
                if o and o["id"] not in orders_dict:
                    orders_dict[o["id"]] = AffectedOrder(
                        id=o["id"], timestamp=o["timestamp"], status=o["status"]
                    )
                
                if d and d["id"] not in dishes_dict:
                    dishes_dict[d["id"]] = AffectedDish(
                        id=d["id"], name=d["name"], category=d["category"],
                        price=d["price"], status=d["status"]
                    )
                
                if k and k["id"] not in kitchens_dict:
                    kitchens_dict[k["id"]] = AffectedKitchen(
                        id=k["id"], name=k["name"], city=k["city"],
                        location=k["location"], status=k["status"]
                    )
                
                if b and b["id"] not in batches_dict:
                    batches_dict[b["id"]] = BatchSummary(
                        id=b["id"], ingredient=b["ingredient"], quantity=b["quantity"],
                        received_date=b["received_date"], expiry_date=b["expiry_date"],
                        status=b["status"]
                    )
                
                if s and s["id"] not in suppliers_dict:
                    suppliers_dict[s["id"]] = SupplierSummary(
                        id=s["id"], name=s["name"], location=s["location"]
                    )
            
            return {
                "success": True,
                "investigation_type": "customer",
                "entity_id": customer_id,
                "customer": AffectedCustomer(
                    id=customer_node["id"],
                    name=customer_node["name"],
                    city=customer_node["city"]
                ),
                "orders": list(orders_dict.values()),
                "dishes": list(dishes_dict.values()),
                "kitchens": list(kitchens_dict.values()),
                "batches": list(batches_dict.values()),
                "suppliers": list(suppliers_dict.values()),
                "impact": {
                    "orders": len(orders_dict),
                    "dishes": len(dishes_dict),
                    "kitchens": len(kitchens_dict),
                    "batches": len(batches_dict),
                    "suppliers": len(suppliers_dict)
                },
                "cypher": CUSTOMER_INVESTIGATION_CYPHER.strip(),
                "parameters": {"customer_id": customer_id}
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Investigation failed")

RECALL_CYPHER = """
MATCH (b:Batch {id: $batch_id})
SET b.status = "CONTAMINATED"
RETURN b
"""

@router.post("/api/recall/batch", response_model=RecallResponse)
def recall_batch(request: RecallRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Database connection unavailable"
        )
    
    if not request.batch_id or not request.batch_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="batch_id is required"
        )

    batch_id = request.batch_id.strip()

    try:
        with driver.session(database=settings.neo4j_database) as session:
            result = session.run(RECALL_CYPHER, batch_id=batch_id)
            record = result.single()
            
            if not record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail=f"Batch {batch_id} not found"
                )
            
            b_node = record["b"]
            batch_summary = BatchSummary(
                id=b_node["id"],
                ingredient=b_node["ingredient"],
                quantity=b_node["quantity"],
                received_date=b_node["received_date"],
                expiry_date=b_node["expiry_date"],
                status=b_node["status"]
            )
            
            return RecallResponse(
                success=True,
                batch=batch_summary,
                cypher=RECALL_CYPHER.strip(),
                parameters={"batch_id": batch_id}
            )
            
    except ServiceUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Failed to communicate with Neo4j database"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An unexpected error occurred during recall."
        )

TRACE_ORDER_CYPHER = """
MATCH (o:Order {id: $entity_id})
OPTIONAL MATCH (o)-[:ORDERED_AS]->(d:Dish)
OPTIONAL MATCH (d)<-[:USED_IN]-(k:Kitchen)
OPTIONAL MATCH (k)<-[:DELIVERED_TO]-(b:Batch)
OPTIONAL MATCH (b)<-[:SUPPLIES]-(s:Supplier)
RETURN o, d, k, b, s
"""

TRACE_CUSTOMER_CYPHER = """
MATCH (c:Customer {id: $entity_id})
OPTIONAL MATCH (c)<-[:PLACED_BY]-(o:Order)
OPTIONAL MATCH (o)-[:ORDERED_AS]->(d:Dish)
OPTIONAL MATCH (d)<-[:USED_IN]-(k:Kitchen)
OPTIONAL MATCH (k)<-[:DELIVERED_TO]-(b:Batch)
OPTIONAL MATCH (b)<-[:SUPPLIES]-(s:Supplier)
RETURN c, o, d, k, b, s
"""

@router.post("/api/trace/origin", response_model=TraceOriginResponse)
def trace_origin(request: TraceOriginRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    e_type = request.entity_type.strip()
    e_id = request.entity_id.strip()
    
    if e_type not in ["Order", "Customer"]:
        raise HTTPException(status_code=400, detail="Invalid entity_type for trace")
        
    cypher = TRACE_ORDER_CYPHER if e_type == "Order" else TRACE_CUSTOMER_CYPHER
    
    with driver.session(database=settings.neo4j_database) as session:
        result = session.run(cypher, entity_id=e_id)
        records = list(result)
        
        if not records:
            raise HTTPException(status_code=404, detail=f"{e_type} {e_id} not found")
            
        record = records[0] # The upstream path is guaranteed to be a single linear path in our current model schema, or at least we take the primary path. Actually multiple dishes could be in an order, but for simplicity of this trace demo we expect one root cause.
        
        # Build path and entities
        path = []
        c_node = record.get("c")
        o_node = record.get("o")
        d_node = record.get("d")
        k_node = record.get("k")
        b_node = record.get("b")
        s_node = record.get("s")
        
        customer, order, dish, kitchen, batch, supplier = None, None, None, None, None, None
        
        if c_node:
            customer = AffectedCustomer(id=c_node["id"], name=c_node.get("name",""), city=c_node.get("city",""))
            path.append(TracePathNode(label="Customer", id=c_node["id"], name=c_node.get("name","")))
        if o_node:
            order = AffectedOrder(id=o_node["id"], timestamp=o_node.get("timestamp",""), status=o_node.get("status",""))
            path.append(TracePathNode(label="Order", id=o_node["id"]))
        if d_node:
            dish = AffectedDish(id=d_node["id"], name=d_node.get("name",""), category=d_node.get("category",""), price=d_node.get("price",0), status=d_node.get("status",""))
            path.append(TracePathNode(label="Dish", id=d_node["id"], name=d_node.get("name","")))
        if k_node:
            kitchen = AffectedKitchen(id=k_node["id"], name=k_node.get("name",""), city=k_node.get("city",""), location=k_node.get("location",""), status=k_node.get("status",""))
            path.append(TracePathNode(label="Kitchen", id=k_node["id"], name=k_node.get("name","")))
        if b_node:
            batch = BatchSummary(id=b_node["id"], ingredient=b_node.get("ingredient",""), quantity=b_node.get("quantity",0), received_date=b_node.get("received_date",""), expiry_date=b_node.get("expiry_date",""), status=b_node.get("status",""))
            path.append(TracePathNode(label="Batch", id=b_node["id"], name=b_node.get("ingredient","")))
        if s_node:
            supplier = SupplierSummary(id=s_node["id"], name=s_node.get("name",""), location=s_node.get("location",""))
            path.append(TracePathNode(label="Supplier", id=s_node["id"], name=s_node.get("name","")))
            
        return TraceOriginResponse(
            success=True,
            source_entity_type=e_type,
            source_entity_id=e_id,
            path=path,
            supplier=supplier,
            batch=batch,
            kitchen=kitchen,
            dish=dish,
            order=order,
            customer=customer,
            cypher=cypher.strip(),
            parameters={"entity_id": e_id}
        )

SIMULATE_REMAINING_CYPHER = """
MATCH (b:Batch {id: $batch_id})-[:DELIVERED_TO]->(k:Kitchen)
WHERE k.id <> $kitchen_id
OPTIONAL MATCH (k)-[:USED_IN]->(d:Dish)<-[:ORDERED_AS]-(o:Order)-[:PLACED_BY]->(c:Customer)
RETURN k, d, o, c
"""

SIMULATE_CONTAINED_CYPHER = """
MATCH (b:Batch {id: $batch_id})-[:DELIVERED_TO]->(k:Kitchen {id: $kitchen_id})
OPTIONAL MATCH (k)-[:USED_IN]->(d:Dish)<-[:ORDERED_AS]-(o:Order)-[:PLACED_BY]->(c:Customer)
RETURN k, d, o, c
"""

def extract_scope(records):
    k_dict, d_dict, o_dict, c_dict = {}, {}, {}, {}
    for record in records:
        k = record.get("k")
        d = record.get("d")
        o = record.get("o")
        c = record.get("c")
        
        if k and k["id"] not in k_dict:
            k_dict[k["id"]] = AffectedKitchen(id=k["id"], name=k.get("name",""), city=k.get("city",""), location=k.get("location",""), status=k.get("status",""))
        if d and d["id"] not in d_dict:
            d_dict[d["id"]] = AffectedDish(id=d["id"], name=d.get("name",""), category=d.get("category",""), price=d.get("price",0), status=d.get("status",""))
        if o and o["id"] not in o_dict:
            o_dict[o["id"]] = AffectedOrder(id=o["id"], timestamp=o.get("timestamp",""), status=o.get("status",""))
        if c and c["id"] not in c_dict:
            c_dict[c["id"]] = AffectedCustomer(id=c["id"], name=c.get("name",""), city=c.get("city",""))
            
    return SimulationScope(
        kitchens=list(k_dict.values()),
        dishes=list(d_dict.values()),
        orders=list(o_dict.values()),
        customers=list(c_dict.values()),
        counts=ImpactSummary(
            kitchens=len(k_dict), dishes=len(d_dict), orders=len(o_dict), customers=len(c_dict)
        )
    )

@router.post("/api/simulate/containment", response_model=SimulateContainmentResponse)
def simulate_containment(request: SimulateContainmentRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    b_id = request.batch_id.strip()
    k_id = request.kitchen_id.strip()
    
    with driver.session(database=settings.neo4j_database) as session:
        # Verify connection exists
        check_cypher = "MATCH (b:Batch {id: $b_id})-[:DELIVERED_TO]->(k:Kitchen {id: $k_id}) RETURN b"
        if not session.run(check_cypher, b_id=b_id, k_id=k_id).single():
            raise HTTPException(status_code=404, detail="Kitchen is not affected by this batch")
            
        remaining_records = list(session.run(SIMULATE_REMAINING_CYPHER, batch_id=b_id, kitchen_id=k_id))
        contained_records = list(session.run(SIMULATE_CONTAINED_CYPHER, batch_id=b_id, kitchen_id=k_id))
        
        remaining_scope = extract_scope(remaining_records)
        contained_scope = extract_scope(contained_records)
        
        # Combine Cypher for display
        combined_cypher = f"// REMAINING SCOPE\n{SIMULATE_REMAINING_CYPHER.strip()}\n\n// CONTAINED SCOPE\n{SIMULATE_CONTAINED_CYPHER.strip()}"
        
        return SimulateContainmentResponse(
            success=True,
            batch_id=b_id,
            containment_kitchen_id=k_id,
            remaining=remaining_scope,
            contained=contained_scope,
            cypher=combined_cypher,
            parameters={"batch_id": b_id, "kitchen_id": k_id}
        )


# Enhanced: Order Exposure Explanation
ORDER_EXPLANATION_CYPHER = """
MATCH (o:Order {id: $order_id})-[:ORDERED_AS]->(d:Dish)
OPTIONAL MATCH (d)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(ing:Ingredient)
OPTIONAL MATCH (o)-[:ORDERED_AS]->(d)<-[:USED_IN]-(k:Kitchen)
OPTIONAL MATCH (k)-[:HAS_INVENTORY]->(inv:Inventory)-[:CONTAINS]->(ing)
OPTIONAL MATCH (inv)-[:SOURCED_FROM]->(b:Batch)
WHERE b.status = 'CONTAMINATED' OR b.status = 'QUARANTINED'
OPTIONAL MATCH (b)<-[:SUPPLIES]-(s:Supplier)
RETURN o, d, k, r, ing, inv, b, s
"""

@router.post("/api/explain/order", response_model=OrderExplanationResponse)
def explain_order_exposure(request: OrderExplanationRequest):
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    order_id = request.order_id.strip()
    
    with driver.session(database=settings.neo4j_database) as session:
        result = session.run(ORDER_EXPLANATION_CYPHER, order_id=order_id)
        records = list(result)
        
        if not records:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        
        # Check if order is affected by contaminated batch
        is_affected = False
        contaminated_batch = None
        affected_inventory = []
        recipes_used = []
        exposure_path = []
        
        for record in records:
            o_node = record.get("o")
            d_node = record.get("d")
            k_node = record.get("k")
            r_node = record.get("r")
            ing_node = record.get("ing")
            inv_node = record.get("inv")
            b_node = record.get("b")
            s_node = record.get("s")
            
            # Build exposure path
            if o_node and o_node not in [n["id"] for n in exposure_path if n.get("id") == o_node["id"]]:
                exposure_path.append(ExposurePathNode(
                    node_type="Order",
                    id=o_node["id"],
                    details={"timestamp": o_node.get("timestamp", "")}
                ))
            
            if d_node:
                exposure_path.append(ExposurePathNode(
                    node_type="Dish",
                    id=d_node["id"],
                    name=d_node.get("name", ""),
                    details={"category": d_node.get("category", "")}
                ))
            
            if r_node:
                recipes_used.append(RecipeSummary(
                    id=r_node["id"],
                    dish_id=r_node.get("dish_id", ""),
                    ingredient_id=r_node.get("ingredient_id", ""),
                    quantity_per_serving=float(r_node.get("quantity_per_serving", 0)),
                    unit=r_node.get("unit", ""),
                    is_required=r_node.get("is_required", True)
                ))
            
            if ing_node:
                exposure_path.append(ExposurePathNode(
                    node_type="Ingredient",
                    id=ing_node["id"],
                    name=ing_node.get("name", ""),
                    details={"category": ing_node.get("category", "")}
                ))
            
            if inv_node:
                inventory = InventorySummary(
                    id=inv_node["id"],
                    batch_id=inv_node.get("batch_id", ""),
                    kitchen_id=inv_node.get("kitchen_id", ""),
                    ingredient_id=inv_node.get("ingredient_id", ""),
                    received_quantity=float(inv_node.get("received_quantity", 0)),
                    consumed_quantity=float(inv_node.get("consumed_quantity", 0)),
                    remaining_quantity=float(inv_node.get("remaining_quantity", 0)),
                    unit=inv_node.get("unit", ""),
                    status=inv_node.get("status", "")
                )
                if inventory not in affected_inventory:
                    affected_inventory.append(inventory)
                
                exposure_path.append(ExposurePathNode(
                    node_type="Inventory",
                    id=inv_node["id"],
                    name=f"Kitchen {inv_node.get('kitchen_id', '')} Stock",
                    details={
                        "remaining": float(inv_node.get("remaining_quantity", 0)),
                        "status": inv_node.get("status", "")
                    }
                ))
            
            if b_node and (b_node.get("status") == "CONTAMINATED" or b_node.get("status") == "QUARANTINED"):
                is_affected = True
                if not contaminated_batch:
                    contaminated_batch = BatchSummary(
                        id=b_node["id"],
                        ingredient=b_node.get("ingredient", ""),
                        quantity=int(b_node.get("quantity", 0)),
                        received_date=b_node.get("received_date", ""),
                        expiry_date=b_node.get("expiry_date", ""),
                        status=b_node.get("status", "")
                    )
                
                exposure_path.append(ExposurePathNode(
                    node_type="Batch",
                    id=b_node["id"],
                    name=b_node.get("ingredient", ""),
                    details={"status": b_node.get("status", "CONTAMINATED")}
                ))
            
            if s_node:
                exposure_path.append(ExposurePathNode(
                    node_type="Supplier",
                    id=s_node["id"],
                    name=s_node.get("name", ""),
                    details={"location": s_node.get("location", "")}
                ))
        
        # Generate explanation
        if is_affected and contaminated_batch:
            dish_name = exposure_path[1].name if len(exposure_path) > 1 else "this dish"
            ingredient_name = next((node.name for node in exposure_path if node.node_type == "Ingredient"), "ingredient")
            
            explanation = (
                f"Order {order_id} is affected because it contains {dish_name}, "
                f"which uses {ingredient_name} from contaminated Batch {contaminated_batch.id}. "
                f"The kitchen inventory sourced from this batch has been flagged. "
            )
            
            if affected_inventory:
                inv = affected_inventory[0]
                explanation += f"Remaining unsafe stock: {inv.remaining_quantity} {inv.unit}."
        else:
            explanation = f"Order {order_id} is not affected by any contaminated batches based on current investigation data."
        
        return OrderExplanationResponse(
            success=True,
            order_id=order_id,
            is_affected=is_affected,
            explanation=explanation,
            exposure_path=exposure_path,
            contaminated_batch=contaminated_batch,
            affected_inventory=affected_inventory,
            recipes_used=recipes_used,
            cypher=ORDER_EXPLANATION_CYPHER.strip(),
            parameters={"order_id": order_id}
        )
