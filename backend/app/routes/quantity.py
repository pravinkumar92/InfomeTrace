from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.database import db

router = APIRouter()

# ============================================================
# Helper: Get All Batches
# ============================================================

@router.get("/api/quantity/batches")
def get_all_batches():
    """
    Get list of all batches with their status
    """
    query = """
    MATCH (b:Batch)
    RETURN b.id AS id,
           b.ingredient AS ingredient,
           b.status AS status,
           b.received_date AS received_date
    ORDER BY b.received_date DESC
    """
    
    result = db.driver.execute_query(query)
    
    batches = []
    for record in result.records:
        batches.append({
            'id': record['id'],
            'ingredient': record['ingredient'],
            'status': record['status'],
            'received_date': str(record['received_date']) if record['received_date'] else None
        })
    
    return {
        'success': True,
        'batches': batches,
        'total': len(batches)
    }

# ============================================================
# Models
# ============================================================

class InventoryItem(BaseModel):
    id: str
    kitchen_id: str
    batch_id: str
    ingredient: str
    received_quantity: float
    used_quantity: float
    remaining_quantity: float
    contaminated_quantity: float
    unit: str
    status: str
    storage_location: str

class BatchQuantityBreakdown(BaseModel):
    batch_id: str
    ingredient: str
    initial_quantity: float
    total_distributed: float
    total_used: float
    total_remaining: float
    total_contaminated: float
    unit: str
    kitchens: List[Dict]

class RecoveryPartner(BaseModel):
    id: str
    name: str
    type: str
    location: str
    rate_per_kg: float
    minimum_quantity: float
    accepted_waste_types: List[str]
    transportation_cost_per_km: float
    rating: float
    status: str

class RecoverySimulation(BaseModel):
    batch_id: str
    total_contaminated: float
    recoverable_quantity: float
    waste_quantity: float
    recommended_partner: Optional[Dict]
    estimated_recovery: float
    transportation_cost: float
    net_recovery: float
    financial_impact: Dict

# ============================================================
# API Endpoints
# ============================================================

@router.get("/api/quantity/batch/{batch_id}", response_model=BatchQuantityBreakdown)
def get_batch_quantity_breakdown(batch_id: str):
    """
    Get complete quantity breakdown for a batch
    Auto-generates distribution if inventory data not present
    """
    query = """
    MATCH (b:Batch {id: $batch_id})
    OPTIONAL MATCH (b)-[:HAS_INVENTORY]->(inv:Inventory)-[:LOCATED_AT]->(k:Kitchen)
    RETURN b.id AS batch_id,
           b.ingredient AS ingredient,
           b.quantity AS total_quantity,
           b.unit AS unit,
           b.status AS status,
           count(inv) AS inventory_count,
           collect({
               kitchen_id: k.id,
               kitchen_name: k.name,
               received: inv.received_quantity,
               used: inv.used_quantity,
               remaining: inv.remaining_quantity,
               contaminated: inv.contaminated_quantity,
               status: inv.status
           }) AS kitchens
    """
    
    result = db.driver.execute_query(query, batch_id=batch_id)
    
    if not result.records:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    record = result.records[0]
    total_quantity = record['total_quantity'] or 200
    batch_status = record['status'] or 'SAFE'
    inventory_count = record['inventory_count']
    
    # If no inventory data, auto-generate realistic distribution
    if inventory_count == 0 or not record['kitchens'] or record['kitchens'][0]['kitchen_id'] is None:
        # Get available kitchens
        kitchens_query = """
        MATCH (k:Kitchen)
        RETURN k.id AS kitchen_id, k.name AS kitchen_name
        LIMIT 3
        """
        kitchens_result = db.driver.execute_query(kitchens_query)
        
        # Generate distribution
        kitchens = []
        if batch_status == 'FLAGGED':
            distributions = [
                {'ratio': 0.35, 'used_ratio': 0.80},
                {'ratio': 0.40, 'used_ratio': 0.85},
                {'ratio': 0.25, 'used_ratio': 0.75}
            ]
        else:
            distributions = [
                {'ratio': 0.35, 'used_ratio': 1.0},
                {'ratio': 0.40, 'used_ratio': 1.0},
                {'ratio': 0.25, 'used_ratio': 0.95}
            ]
        
        for idx, k_record in enumerate(kitchens_result.records[:3]):
            dist = distributions[idx]
            received = round(total_quantity * dist['ratio'], 1)
            used = round(received * dist['used_ratio'], 1)
            remaining = round(received - used, 1)
            contaminated = remaining if batch_status == 'FLAGGED' else 0
            
            kitchens.append({
                'kitchen_id': k_record['kitchen_id'],
                'kitchen_name': k_record['kitchen_name'],
                'received': received,
                'used': used,
                'remaining': remaining,
                'contaminated': contaminated,
                'status': 'CONTAMINATED' if contaminated > 0 else 'AVAILABLE'
            })
    else:
        kitchens = record['kitchens']
    
    total_distributed = sum(k['received'] or 0 for k in kitchens)
    total_used = sum(k['used'] or 0 for k in kitchens)
    total_remaining = sum(k['remaining'] or 0 for k in kitchens)
    total_contaminated = sum(k['contaminated'] or 0 for k in kitchens)
    
    return BatchQuantityBreakdown(
        batch_id=record['batch_id'],
        ingredient=record['ingredient'],
        initial_quantity=total_quantity,
        total_distributed=total_distributed,
        total_used=total_used,
        total_remaining=total_remaining,
        total_contaminated=total_contaminated,
        unit=record['unit'] or 'kg',
        kitchens=kitchens
    )


@router.get("/api/quantity/kitchen/{kitchen_id}")
def get_kitchen_inventory(kitchen_id: str):
    """
    Get all inventory items for a kitchen
    """
    query = """
    MATCH (k:Kitchen {id: $kitchen_id})-[:HAS_INVENTORY]->(inv:Inventory)-[:FROM_BATCH]->(b:Batch)
    RETURN inv.id AS id,
           inv.kitchen_id AS kitchen_id,
           inv.batch_id AS batch_id,
           inv.ingredient AS ingredient,
           inv.received_quantity AS received_quantity,
           inv.used_quantity AS used_quantity,
           inv.remaining_quantity AS remaining_quantity,
           inv.contaminated_quantity AS contaminated_quantity,
           inv.unit AS unit,
           inv.status AS status,
           inv.storage_location AS storage_location,
           b.status AS batch_status
    ORDER BY inv.received_date DESC
    """
    
    result = db.driver.execute_query(query, kitchen_id=kitchen_id)
    
    inventory = []
    for record in result.records:
        inventory.append({
            'id': record['id'],
            'kitchen_id': record['kitchen_id'],
            'batch_id': record['batch_id'],
            'ingredient': record['ingredient'],
            'received_quantity': record['received_quantity'],
            'used_quantity': record['used_quantity'],
            'remaining_quantity': record['remaining_quantity'],
            'contaminated_quantity': record['contaminated_quantity'],
            'unit': record['unit'],
            'status': record['status'],
            'storage_location': record['storage_location'],
            'batch_status': record['batch_status']
        })
    
    return {
        'success': True,
        'kitchen_id': kitchen_id,
        'inventory': inventory,
        'total_items': len(inventory)
    }


@router.get("/api/quantity/partners")
def get_recovery_partners():
    """
    Get all recovery partners
    """
    query = """
    MATCH (p:RecoveryPartner)
    WHERE p.status = 'ACTIVE'
    RETURN p.id AS id,
           p.name AS name,
           p.type AS type,
           p.location AS location,
           p.rate_per_kg AS rate_per_kg,
           p.minimum_quantity AS minimum_quantity,
           p.accepted_waste_types AS accepted_waste_types,
           p.transportation_cost_per_km AS transportation_cost_per_km,
           p.rating AS rating,
           p.contact_phone AS contact_phone,
           p.contact_email AS contact_email,
           p.status AS status
    ORDER BY p.rating DESC
    """
    
    result = db.driver.execute_query(query)
    
    partners = []
    for record in result.records:
        partners.append({
            'id': record['id'],
            'name': record['name'],
            'type': record['type'],
            'location': record['location'],
            'rate_per_kg': record['rate_per_kg'],
            'minimum_quantity': record['minimum_quantity'],
            'accepted_waste_types': record['accepted_waste_types'],
            'transportation_cost_per_km': record['transportation_cost_per_km'],
            'rating': record['rating'],
            'contact_phone': record['contact_phone'],
            'contact_email': record['contact_email'],
            'status': record['status']
        })
    
    return {
        'success': True,
        'partners': partners,
        'total': len(partners)
    }


@router.post("/api/quantity/recovery/simulate")
def simulate_waste_recovery(batch_id: str):
    """
    Simulate waste recovery for a contaminated batch
    Auto-generates kitchen distribution if not present
    """
    # Get batch and check if inventory exists
    batch_query = """
    MATCH (b:Batch {id: $batch_id})
    OPTIONAL MATCH (b)-[:HAS_INVENTORY]->(inv:Inventory)-[:LOCATED_AT]->(k:Kitchen)
    RETURN b.id AS batch_id,
           b.ingredient AS ingredient,
           b.quantity AS total_quantity,
           b.supplier_cost_per_unit AS cost_per_unit,
           b.unit AS unit,
           b.status AS status,
           count(inv) AS inventory_count,
           collect({
               kitchen_id: k.id,
               kitchen_name: k.name,
               remaining: inv.remaining_quantity,
               used: inv.used_quantity,
               contaminated: inv.contaminated_quantity
           }) AS kitchens
    """
    
    result = db.driver.execute_query(batch_query, batch_id=batch_id)
    
    if not result.records:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    record = result.records[0]
    total_quantity = record['total_quantity'] or 200
    batch_status = record['status'] or 'SAFE'
    cost_per_unit = record['cost_per_unit'] or 300
    inventory_count = record['inventory_count']
    
    # If no inventory data, auto-generate realistic distribution
    if inventory_count == 0 or not record['kitchens'] or record['kitchens'][0]['kitchen_id'] is None:
        # Get available kitchens
        kitchens_query = """
        MATCH (k:Kitchen)
        RETURN k.id AS kitchen_id, k.name AS kitchen_name
        LIMIT 3
        """
        kitchens_result = db.driver.execute_query(kitchens_query)
        
        # Generate distribution based on batch status
        kitchens = []
        if batch_status == 'FLAGGED':
            # Contaminated batch - distribute with some remaining
            distributions = [
                {'ratio': 0.35, 'used_ratio': 0.80},  # K01: 35% of batch, 80% used
                {'ratio': 0.40, 'used_ratio': 0.85},  # K02: 40% of batch, 85% used
                {'ratio': 0.25, 'used_ratio': 0.75}   # K03: 25% of batch, 75% used
            ]
        else:
            # Safe batch - most used
            distributions = [
                {'ratio': 0.35, 'used_ratio': 1.0},   # K01: fully used
                {'ratio': 0.40, 'used_ratio': 1.0},   # K02: fully used
                {'ratio': 0.25, 'used_ratio': 0.95}   # K03: 95% used
            ]
        
        for idx, k_record in enumerate(kitchens_result.records[:3]):
            dist = distributions[idx]
            received = round(total_quantity * dist['ratio'], 1)
            used = round(received * dist['used_ratio'], 1)
            remaining = round(received - used, 1)
            contaminated = remaining if batch_status == 'FLAGGED' else 0
            
            kitchens.append({
                'kitchen_id': k_record['kitchen_id'],
                'kitchen_name': k_record['kitchen_name'],
                'remaining': remaining,
                'used': used,
                'contaminated': contaminated
            })
    else:
        kitchens = record['kitchens']
    
    # Calculate quantities
    recoverable_quantity = sum(k['remaining'] or 0 for k in kitchens if k['contaminated'] and k['contaminated'] > 0)
    waste_quantity = sum(k['used'] or 0 for k in kitchens if k['contaminated'] and k['contaminated'] > 0)
    total_contaminated = recoverable_quantity + waste_quantity
    
    # Get best recovery partner
    partners_query = """
    MATCH (p:RecoveryPartner)
    WHERE p.status = 'ACTIVE' AND p.minimum_quantity <= $quantity
    RETURN p.id AS id,
           p.name AS name,
           p.type AS type,
           p.location AS location,
           p.rate_per_kg AS rate_per_kg,
           p.transportation_cost_per_km AS transport_cost,
           p.rating AS rating
    ORDER BY (p.rate_per_kg - (p.transportation_cost_per_km * 10)) DESC
    LIMIT 1
    """
    
    partner_result = db.driver.execute_query(partners_query, quantity=recoverable_quantity)
    
    recommended_partner = None
    recovery_value = 0
    transport_cost = 0
    
    if partner_result.records:
        p = partner_result.records[0]
        recommended_partner = {
            'id': p['id'],
            'name': p['name'],
            'type': p['type'],
            'location': p['location'],
            'rate_per_kg': p['rate_per_kg']
        }
        recovery_value = recoverable_quantity * p['rate_per_kg']
        transport_cost = 10 * p['transport_cost']  # Assume 10km average distance
    
    net_recovery = recovery_value - transport_cost
    
    # Financial impact
    original_cost = total_quantity * cost_per_unit
    contaminated_cost = total_contaminated * cost_per_unit
    
    financial_impact = {
        'original_batch_cost': original_cost,
        'contaminated_value_loss': contaminated_cost,
        'recovery_value': recovery_value,
        'transportation_cost': transport_cost,
        'net_recovery': net_recovery,
        'recovery_percentage': (net_recovery / contaminated_cost * 100) if contaminated_cost > 0 else 0,
        'final_loss': contaminated_cost - net_recovery
    }
    
    return {
        'success': True,
        'batch_id': batch_id,
        'ingredient': record['ingredient'],
        'total_contaminated': total_contaminated,
        'recoverable_quantity': recoverable_quantity,
        'waste_quantity': waste_quantity,
        'unit': record['unit'],
        'recommended_partner': recommended_partner,
        'estimated_recovery': recovery_value,
        'transportation_cost': transport_cost,
        'net_recovery': net_recovery,
        'financial_impact': financial_impact,
        'kitchens': kitchens
    }
