// ============================================================
// Quantity Tracking & Waste Recovery Schema
// ============================================================

// 1. Add quantity fields to Batch nodes
MATCH (b:Batch)
SET b.initial_quantity = toFloat(b.quantity),
    b.unit = 'kg',
    b.supplier_cost_per_unit = 300.0;

// 2. Create Inventory nodes (Kitchen stock tracking)
CREATE CONSTRAINT inventory_id IF NOT EXISTS FOR (i:Inventory) REQUIRE i.id IS UNIQUE;

// Sample Inventory nodes for K01
CREATE (inv1:Inventory {
  id: 'INV_K01_B001',
  kitchen_id: 'K01',
  batch_id: 'B001',
  ingredient: 'Organic Tomatoes',
  received_quantity: 15.0,
  used_quantity: 8.0,
  remaining_quantity: 7.0,
  contaminated_quantity: 0.0,
  unit: 'kg',
  status: 'IN_STOCK',
  storage_location: 'COLD_STORAGE_A1',
  received_date: datetime('2024-01-15T10:00:00')
});

CREATE (inv2:Inventory {
  id: 'INV_K01_B002',
  kitchen_id: 'K01',
  batch_id: 'B002',
  ingredient: 'Paneer Block',
  received_quantity: 12.0,
  used_quantity: 5.0,
  remaining_quantity: 7.0,
  contaminated_quantity: 7.0,
  unit: 'kg',
  status: 'CONTAMINATED',
  storage_location: 'COLD_STORAGE_A2',
  received_date: datetime('2024-01-15T10:00:00')
});

CREATE (inv3:Inventory {
  id: 'INV_K02_B002',
  kitchen_id: 'K02',
  batch_id: 'B002',
  ingredient: 'Paneer Block',
  received_quantity: 10.0,
  used_quantity: 7.0,
  remaining_quantity: 3.0,
  contaminated_quantity: 3.0,
  unit: 'kg',
  status: 'CONTAMINATED',
  storage_location: 'FREEZER_B1',
  received_date: datetime('2024-01-15T11:00:00')
});

CREATE (inv4:Inventory {
  id: 'INV_K03_B002',
  kitchen_id: 'K03',
  batch_id: 'B002',
  ingredient: 'Paneer Block',
  received_quantity: 8.0,
  used_quantity: 2.0,
  remaining_quantity: 6.0,
  contaminated_quantity: 6.0,
  unit: 'kg',
  status: 'CONTAMINATED',
  storage_location: 'COLD_STORAGE_C1',
  received_date: datetime('2024-01-15T09:00:00')
});

// 3. Connect Kitchen → Inventory → Batch
MATCH (k:Kitchen {id: 'K01'})
MATCH (inv:Inventory {id: 'INV_K01_B001'})
MATCH (b:Batch {id: 'B001'})
MERGE (k)-[:HAS_INVENTORY]->(inv)
MERGE (inv)-[:FROM_BATCH]->(b);

MATCH (k:Kitchen {id: 'K01'})
MATCH (inv:Inventory {id: 'INV_K01_B002'})
MATCH (b:Batch {id: 'B002'})
MERGE (k)-[:HAS_INVENTORY]->(inv)
MERGE (inv)-[:FROM_BATCH]->(b);

MATCH (k:Kitchen {id: 'K02'})
MATCH (inv:Inventory {id: 'INV_K02_B002'})
MATCH (b:Batch {id: 'B002'})
MERGE (k)-[:HAS_INVENTORY]->(inv)
MERGE (inv)-[:FROM_BATCH]->(b);

MATCH (k:Kitchen {id: 'K03'})
MATCH (inv:Inventory {id: 'INV_K03_B002'})
MATCH (b:Batch {id: 'B002'})
MERGE (k)-[:HAS_INVENTORY]->(inv)
MERGE (inv)-[:FROM_BATCH]->(b);

// 4. Add quantity usage to Dishes
MATCH (d:Dish {id: 'D01'})
SET d.paneer_per_serving = 0.15,
    d.tomato_per_serving = 0.1,
    d.servings_made = 20;

MATCH (d:Dish {id: 'D02'})
SET d.paneer_per_serving = 0.2,
    d.tomato_per_serving = 0.05,
    d.servings_made = 15;

MATCH (d:Dish {id: 'D03'})
SET d.paneer_per_serving = 0.1,
    d.servings_made = 25;

MATCH (d:Dish {id: 'D04'})
SET d.paneer_per_serving = 0.25,
    d.servings_made = 12;

MATCH (d:Dish {id: 'D05'})
SET d.paneer_per_serving = 0.3,
    d.tomato_per_serving = 0.15,
    d.servings_made = 10;

// 5. Add servings to Orders
MATCH (o:Order {id: 'O01'})
SET o.servings = 2,
    o.paneer_consumed = 0.3;

MATCH (o:Order {id: 'O02'})
SET o.servings = 1,
    o.paneer_consumed = 0.2;

MATCH (o:Order {id: 'O03'})
SET o.servings = 3,
    o.paneer_consumed = 0.3;

MATCH (o:Order {id: 'O04'})
SET o.servings = 2,
    o.paneer_consumed = 0.3;

// 6. Create Recovery Partner nodes
CREATE CONSTRAINT partner_id IF NOT EXISTS FOR (p:RecoveryPartner) REQUIRE p.id IS UNIQUE;

CREATE (p1:RecoveryPartner {
  id: 'RP001',
  name: 'Green Bio Fertilizers Pvt Ltd',
  type: 'FERTILIZER',
  location: 'Gurgaon, Haryana',
  latitude: 28.4595,
  longitude: 77.0266,
  rate_per_kg: 12.0,
  minimum_quantity: 50.0,
  accepted_waste_types: ['RAW_ORGANIC', 'DAIRY', 'VEGETABLES'],
  transportation_cost_per_km: 8.0,
  contact_phone: '+91-9876543210',
  contact_email: 'pickup@greenbiofertilizers.com',
  rating: 4.5,
  certifications: ['ISO_14001', 'FSSAI_APPROVED'],
  status: 'ACTIVE'
});

CREATE (p2:RecoveryPartner {
  id: 'RP002',
  name: 'Delhi Compost Plant',
  type: 'COMPOST',
  location: 'Okhla, Delhi',
  latitude: 28.5355,
  longitude: 77.2750,
  rate_per_kg: 7.0,
  minimum_quantity: 100.0,
  accepted_waste_types: ['ALL_ORGANIC'],
  transportation_cost_per_km: 6.0,
  contact_phone: '+91-9876543211',
  contact_email: 'waste@delhicompost.in',
  rating: 4.2,
  certifications: ['MUNICIPAL_APPROVED'],
  status: 'ACTIVE'
});

CREATE (p3:RecoveryPartner {
  id: 'RP003',
  name: 'Noida Biogas Energy',
  type: 'BIOGAS',
  location: 'Noida, UP',
  latitude: 28.5355,
  longitude: 77.3910,
  rate_per_kg: 10.0,
  minimum_quantity: 75.0,
  accepted_waste_types: ['ALL_ORGANIC', 'COOKED_FOOD'],
  transportation_cost_per_km: 7.0,
  contact_phone: '+91-9876543212',
  contact_email: 'collection@noidabiogas.com',
  rating: 4.7,
  certifications: ['ISO_14001', 'RENEWABLE_ENERGY_CERT'],
  status: 'ACTIVE'
});

// 7. Create Waste Recovery Transaction constraint
CREATE CONSTRAINT recovery_tx_id IF NOT EXISTS FOR (tx:WasteRecoveryTransaction) REQUIRE tx.id IS UNIQUE;

// Sample recovery transaction
CREATE (tx1:WasteRecoveryTransaction {
  id: 'WRT_001',
  batch_id: 'B002',
  contamination_date: datetime('2024-01-20T14:00:00'),
  total_contaminated_quantity: 30.0,
  recoverable_quantity: 16.0,
  waste_quantity: 14.0,
  partner_id: 'RP001',
  recovery_value: 192.0,
  transportation_cost: 80.0,
  net_recovery: 112.0,
  status: 'PENDING',
  scheduled_pickup_date: datetime('2024-01-21T10:00:00'),
  created_at: datetime('2024-01-20T15:00:00')
});

MATCH (tx:WasteRecoveryTransaction {id: 'WRT_001'})
MATCH (p:RecoveryPartner {id: 'RP001'})
MATCH (b:Batch {id: 'B002'})
MERGE (tx)-[:USES_PARTNER]->(p)
MERGE (tx)-[:FOR_BATCH]->(b);

// Link transaction to affected kitchens
MATCH (tx:WasteRecoveryTransaction {id: 'WRT_001'})
MATCH (k:Kitchen) WHERE k.id IN ['K01', 'K02', 'K03']
MERGE (tx)-[:FROM_KITCHEN]->(k);
