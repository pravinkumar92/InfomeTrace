from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.database import db
from app.models import (
    StatusUpdateRequest, StatusUpdateResponse, StatusTransitionHistory,
    RecallCascadeRequest, RecallCascadeResponse, AffectedCustomer
)

router = APIRouter()

@router.post("/api/status/update", response_model=StatusUpdateResponse)
async def update_entity_status(request: StatusUpdateRequest):
    """
    Update status of a single entity (batch, inventory, or dish) with full audit trail.
    
    Status transitions:
    - Batch: SAFE → FLAGGED → QUARANTINED → RECALLED/VERIFIED
    - Inventory: AVAILABLE → FLAGGED → QUARANTINED → RECALLED/VERIFIED
    - Dish: AVAILABLE → FLAGGED → SUSPENDED → VERIFIED
    """
    
    entity_label_map = {
        'batch': 'Batch',
        'inventory': 'Inventory',
        'dish': 'Dish'
    }
    
    if request.entity_type not in entity_label_map:
        raise HTTPException(status_code=400, detail=f"Invalid entity_type: {request.entity_type}")
    
    label = entity_label_map[request.entity_type]
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Build status-specific properties
    status_fields = {
        'FLAGGED': 'flagged_at',
        'QUARANTINED': 'quarantined_at',
        'RECALLED': 'recalled_at',
        'SUSPENDED': 'suspended_at',
        'VERIFIED': 'verified_at'
    }
    
    status_field = status_fields.get(request.new_status, None)
    
    # Cypher query to update status
    query = f"""
    MATCH (e:{label} {{id: $entity_id}})
    SET e.status = $new_status,
        e.status_updated_at = $timestamp,
        e.status_reason = $reason
    """
    
    if status_field:
        query += f", e.{status_field} = $timestamp\n"
    
    if request.updated_by:
        query += ", e.status_updated_by = $updated_by\n"
    
    if request.notification_id and request.new_status == 'RECALLED':
        query += ", e.recall_notification_id = $notification_id\n"
    
    query += """
    RETURN e.id AS entity_id, 
           e.status AS previous_status,
           e.name AS entity_name
    """
    
    parameters = {
        "entity_id": request.entity_id,
        "new_status": request.new_status,
        "timestamp": timestamp,
        "reason": request.reason,
        "updated_by": request.updated_by,
        "notification_id": request.notification_id
    }
    
    with db.driver.session() as session:
        # Get previous status first
        previous_result = session.run(
            f"MATCH (e:{label} {{id: $entity_id}}) RETURN e.status AS status, e.name AS name",
            {"entity_id": request.entity_id}
        )
        previous_record = previous_result.single()
        
        if not previous_record:
            raise HTTPException(status_code=404, detail=f"{label} not found: {request.entity_id}")
        
        previous_status = previous_record["status"]
        entity_name = previous_record.get("name", None)
        
        # Update status
        result = session.run(query, parameters)
        updated = result.single()
        
        if not updated:
            raise HTTPException(status_code=500, detail=f"Failed to update {label} status")
        
        # Record transition history
        transition = StatusTransitionHistory(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            entity_name=entity_name,
            previous_status=previous_status,
            new_status=request.new_status,
            transition_timestamp=timestamp,
            reason=request.reason,
            updated_by=request.updated_by
        )
        
        return StatusUpdateResponse(
            success=True,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            previous_status=previous_status,
            new_status=request.new_status,
            status_reason=request.reason,
            timestamp=timestamp,
            cascade_updates=[transition],
            affected_count=1,
            cypher=query,
            parameters=parameters
        )


@router.post("/api/status/recall-cascade", response_model=RecallCascadeResponse)
async def execute_recall_cascade(request: RecallCascadeRequest):
    """
    Execute full recall cascade workflow:
    1. Mark batch as RECALLED
    2. Recall all inventory from that batch
    3. Suspend all dishes using the recalled ingredient
    4. Identify affected customers for notification
    """
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Step 1: Recall the batch
    batch_query = """
    MATCH (b:Batch {id: $batch_id})
    SET b.status = 'RECALLED',
        b.status_updated_at = $timestamp,
        b.status_reason = $reason,
        b.recalled_at = $timestamp,
        b.recalled_by = $recalled_by,
        b.recall_notification_id = $notification_id
    RETURN b.id AS batch_id, b.ingredient AS ingredient
    """
    
    # Step 2: Recall all inventory
    inventory_query = """
    MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: $batch_id})
    SET inv.status = 'RECALLED',
        inv.status_updated_at = $timestamp,
        inv.status_reason = 'Source batch recalled: ' + $reason,
        inv.recalled_at = $timestamp
    RETURN inv.id AS inventory_id, 
           inv.kitchen_id AS kitchen_id,
           inv.ingredient_id AS ingredient_id
    """
    
    # Step 3: Suspend dishes using recalled ingredient
    dish_query = """
    MATCH (b:Batch {id: $batch_id})-[:CONTAINS_INGREDIENT]->(i:Ingredient),
          (d:Dish)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(i)
    SET d.status = 'SUSPENDED',
        d.status_updated_at = $timestamp,
        d.status_reason = 'Contains ingredient from recalled batch ' + $batch_id,
        d.suspended_at = $timestamp
    RETURN d.id AS dish_id, d.name AS dish_name
    """
    
    # Step 4: Identify affected customers
    customer_query = """
    MATCH (b:Batch {id: $batch_id})-[:DELIVERED_TO]->(k:Kitchen),
          (k)-[:USED_IN]->(d:Dish)<-[:ORDERED_AS]-(o:Order)-[:PLACED_BY]->(c:Customer)
    RETURN DISTINCT c.id AS customer_id, 
           c.name AS customer_name,
           c.city AS city
    ORDER BY c.name
    """
    
    parameters = {
        "batch_id": request.batch_id,
        "timestamp": timestamp,
        "reason": request.reason,
        "recalled_by": request.recalled_by,
        "notification_id": request.notification_id
    }
    
    with db.driver.session() as session:
        # Execute cascade
        batch_result = session.run(batch_query, parameters).single()
        if not batch_result:
            raise HTTPException(status_code=404, detail=f"Batch not found: {request.batch_id}")
        
        inventory_results = list(session.run(inventory_query, parameters))
        dish_results = list(session.run(dish_query, parameters))
        customer_results = list(session.run(customer_query, parameters))
        
        # Build transitions list
        transitions = [
            StatusTransitionHistory(
                entity_type='batch',
                entity_id=request.batch_id,
                entity_name=batch_result['ingredient'],
                previous_status='SAFE',
                new_status='RECALLED',
                transition_timestamp=timestamp,
                reason=request.reason,
                updated_by=request.recalled_by
            )
        ]
        
        for inv in inventory_results:
            transitions.append(
                StatusTransitionHistory(
                    entity_type='inventory',
                    entity_id=inv['inventory_id'],
                    entity_name=f"{inv['kitchen_id']} - {inv['ingredient_id']}",
                    previous_status='AVAILABLE',
                    new_status='RECALLED',
                    transition_timestamp=timestamp,
                    reason=f"Source batch {request.batch_id} recalled",
                    updated_by=request.recalled_by
                )
            )
        
        for dish in dish_results:
            transitions.append(
                StatusTransitionHistory(
                    entity_type='dish',
                    entity_id=dish['dish_id'],
                    entity_name=dish['dish_name'],
                    previous_status='AVAILABLE',
                    new_status='SUSPENDED',
                    transition_timestamp=timestamp,
                    reason=f"Contains ingredient from recalled batch {request.batch_id}",
                    updated_by=request.recalled_by
                )
            )
        
        customers = [
            AffectedCustomer(
                id=c['customer_id'],
                name=c['customer_name'],
                city=c['city']
            )
            for c in customer_results
        ]
        
        return RecallCascadeResponse(
            success=True,
            batch_id=request.batch_id,
            batch_recalled=True,
            inventory_recalled=len(inventory_results),
            dishes_suspended=len(dish_results),
            affected_customers=len(customers),
            transitions=transitions,
            customer_notifications_required=customers,
            cypher=f"{batch_query}\n---\n{inventory_query}\n---\n{dish_query}\n---\n{customer_query}",
            parameters=parameters
        )


@router.get("/api/status/audit")
async def get_status_audit():
    """
    Get all entities in non-normal states (FLAGGED, QUARANTINED, RECALLED, SUSPENDED).
    Useful for compliance audits and dashboard overview.
    """
    
    query = """
    MATCH (n)
    WHERE n.status IN ['FLAGGED', 'QUARANTINED', 'RECALLED', 'SUSPENDED']
    RETURN labels(n)[0] AS entity_type,
           n.id AS entity_id,
           n.name AS entity_name,
           n.status AS status,
           n.status_reason AS reason,
           n.status_updated_at AS timestamp,
           n.status_updated_by AS updated_by
    ORDER BY n.status_updated_at DESC
    """
    
    with db.driver.session() as session:
        result = session.run(query)
        records = [dict(record) for record in result]
        
        return {
            "success": True,
            "count": len(records),
            "entities": records,
            "cypher": query
        }
