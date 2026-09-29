// ============================================================
// INFOMETRACE - DEMO SEED DATA
// ============================================================
// Deterministic graph dataset for recall simulation and
// impact analysis scenarios. Safe to run multiple times.
// ============================================================

// ------------------------------------------------------------
// 1. Suppliers (3)
// ------------------------------------------------------------
MERGE (s1:Supplier {id: 'S001'}) ON CREATE SET s1.name = 'FreshFarm Organics', s1.location = 'Haryana', s1.certification = 'FSSAI-A', s1.status = 'ACTIVE';
MERGE (s2:Supplier {id: 'S002'}) ON CREATE SET s2.name = 'Delhi Dairy Co.', s2.location = 'Delhi', s2.certification = 'FSSAI-B', s2.status = 'ACTIVE';
MERGE (s3:Supplier {id: 'S003'}) ON CREATE SET s3.name = 'Noida Greens', s3.location = 'UP', s3.certification = 'FSSAI-A', s3.status = 'ACTIVE';

// ------------------------------------------------------------
// 2. Batches (6) - Enhanced with lifecycle tracking
// ------------------------------------------------------------
// Status values: SAFE, FLAGGED, QUARANTINED, RECALLED, VERIFIED
// Each status change includes timestamp and reason
MERGE (b1:Batch {id: 'B001'}) ON CREATE SET 
  b1.ingredient = 'Organic Tomatoes', 
  b1.quantity = 500, 
  b1.received_date = '2026-09-01', 
  b1.expiry_date = '2026-09-15', 
  b1.status = 'SAFE',
  b1.status_updated_at = '2026-09-01T08:00:00Z',
  b1.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b2:Batch {id: 'B002'}) ON CREATE SET 
  b2.ingredient = 'Paneer Block', 
  b2.quantity = 200, 
  b2.received_date = '2026-09-05', 
  b2.expiry_date = '2026-09-12', 
  b2.status = 'SAFE',
  b2.status_updated_at = '2026-09-05T10:30:00Z',
  b2.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b3:Batch {id: 'B003'}) ON CREATE SET 
  b3.ingredient = 'Wheat Flour', 
  b3.quantity = 1000, 
  b3.received_date = '2026-08-25', 
  b3.expiry_date = '2026-11-25', 
  b3.status = 'SAFE',
  b3.status_updated_at = '2026-08-25T09:00:00Z',
  b3.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b4:Batch {id: 'B004'}) ON CREATE SET 
  b4.ingredient = 'Full Cream Milk', 
  b4.quantity = 300, 
  b4.received_date = '2026-09-06', 
  b4.expiry_date = '2026-09-14', 
  b4.status = 'SAFE',
  b4.status_updated_at = '2026-09-06T07:00:00Z',
  b4.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b5:Batch {id: 'B005'}) ON CREATE SET 
  b5.ingredient = 'Butter', 
  b5.quantity = 150, 
  b5.received_date = '2026-09-01', 
  b5.expiry_date = '2026-10-01', 
  b5.status = 'SAFE',
  b5.status_updated_at = '2026-09-01T11:00:00Z',
  b5.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b6:Batch {id: 'B006'}) ON CREATE SET 
  b6.ingredient = 'Spinach', 
  b6.quantity = 100, 
  b6.received_date = '2026-09-07', 
  b6.expiry_date = '2026-09-17', 
  b6.status = 'SAFE',
  b6.status_updated_at = '2026-09-07T06:30:00Z',
  b6.status_reason = 'Initial delivery - passed quality inspection';

// ------------------------------------------------------------
// 3. Kitchens (4)
// ------------------------------------------------------------
MERGE (k1:Kitchen {id: 'K01'}) ON CREATE SET k1.name = 'Gurugram Central Kitchen', k1.city = 'Gurugram', k1.location = 'Cyber Hub', k1.status = 'ACTIVE';
MERGE (k2:Kitchen {id: 'K02'}) ON CREATE SET k2.name = 'South Delhi Hub', k2.city = 'Delhi', k2.location = 'Saket', k2.status = 'ACTIVE';
MERGE (k3:Kitchen {id: 'K03'}) ON CREATE SET k3.name = 'Noida Extension Kitchen', k3.city = 'Noida', k3.location = 'Sector 62', k3.status = 'ACTIVE';
MERGE (k4:Kitchen {id: 'K04'}) ON CREATE SET k4.name = 'Vasant Kunj Cloud', k4.city = 'Delhi', k4.location = 'Vasant Kunj', k4.status = 'ACTIVE';

// ------------------------------------------------------------
// 4. Dishes (8) - Enhanced with lifecycle tracking
// ------------------------------------------------------------
// Status values: AVAILABLE, FLAGGED, QUARANTINED, SUSPENDED, VERIFIED
// Each status change includes timestamp and reason
MERGE (d1:Dish {id: 'D01'}) ON CREATE SET 
  d1.name = 'Tomato Soup', 
  d1.category = 'Starter', 
  d1.price = 150, 
  d1.status = 'AVAILABLE',
  d1.status_updated_at = '2026-09-01T10:00:00Z',
  d1.status_reason = 'Menu item active - all ingredients verified';

MERGE (d2:Dish {id: 'D02'}) ON CREATE SET 
  d2.name = 'Margherita Pizza', 
  d2.category = 'Main', 
  d2.price = 400, 
  d2.status = 'AVAILABLE',
  d2.status_updated_at = '2026-08-25T12:00:00Z',
  d2.status_reason = 'Menu item active - all ingredients verified';

MERGE (d3:Dish {id: 'D03'}) ON CREATE SET 
  d3.name = 'Paneer Tikka', 
  d3.category = 'Starter', 
  d3.price = 250, 
  d3.status = 'AVAILABLE',
  d3.status_updated_at = '2026-09-05T13:00:00Z',
  d3.status_reason = 'Menu item active - all ingredients verified';

MERGE (d4:Dish {id: 'D04'}) ON CREATE SET 
  d4.name = 'Kadai Paneer', 
  d4.category = 'Main', 
  d4.price = 350, 
  d4.status = 'AVAILABLE',
  d4.status_updated_at = '2026-09-05T13:00:00Z',
  d4.status_reason = 'Menu item active - all ingredients verified';

MERGE (d5:Dish {id: 'D05'}) ON CREATE SET 
  d5.name = 'Paneer Butter Masala', 
  d5.category = 'Main', 
  d5.price = 380, 
  d5.status = 'AVAILABLE',
  d5.status_updated_at = '2026-09-05T13:00:00Z',
  d5.status_reason = 'Menu item active - all ingredients verified';

MERGE (d6:Dish {id: 'D06'}) ON CREATE SET 
  d6.name = 'Tandoori Roti', 
  d6.category = 'Bread', 
  d6.price = 40, 
  d6.status = 'AVAILABLE',
  d6.status_updated_at = '2026-08-25T12:00:00Z',
  d6.status_reason = 'Menu item active - all ingredients verified';

MERGE (d7:Dish {id: 'D07'}) ON CREATE SET 
  d7.name = 'Dal Makhani', 
  d7.category = 'Main', 
  d7.price = 280, 
  d7.status = 'AVAILABLE',
  d7.status_updated_at = '2026-09-06T14:00:00Z',
  d7.status_reason = 'Menu item active - all ingredients verified';

MERGE (d8:Dish {id: 'D08'}) ON CREATE SET 
  d8.name = 'Palak Paneer', 
  d8.category = 'Main', 
  d8.price = 320, 
  d8.status = 'AVAILABLE',
  d8.status_updated_at = '2026-09-07T14:00:00Z',
  d8.status_reason = 'Menu item active - all ingredients verified';

// ------------------------------------------------------------
// 5. Customers (10)
// ------------------------------------------------------------
MERGE (c1:Customer {id: 'C01'}) ON CREATE SET c1.name = 'Rahul Sharma', c1.city = 'Gurugram';
MERGE (c2:Customer {id: 'C02'}) ON CREATE SET c2.name = 'Priya Singh', c2.city = 'Delhi';
MERGE (c3:Customer {id: 'C03'}) ON CREATE SET c3.name = 'Amit Kumar', c3.city = 'Noida';
MERGE (c4:Customer {id: 'C04'}) ON CREATE SET c4.name = 'Neha Gupta', c4.city = 'Gurugram';
MERGE (c5:Customer {id: 'C05'}) ON CREATE SET c5.name = 'Vikram Malhotra', c5.city = 'Delhi';
MERGE (c6:Customer {id: 'C06'}) ON CREATE SET c6.name = 'Sanya Verma', c6.city = 'Noida';
MERGE (c7:Customer {id: 'C07'}) ON CREATE SET c7.name = 'Arjun Das', c7.city = 'Delhi';
MERGE (c8:Customer {id: 'C08'}) ON CREATE SET c8.name = 'Kavita Reddy', c8.city = 'Gurugram';
MERGE (c9:Customer {id: 'C09'}) ON CREATE SET c9.name = 'Rohan Mehta', c9.city = 'Delhi';
MERGE (c10:Customer {id: 'C10'}) ON CREATE SET c10.name = 'Aditi Rao', c10.city = 'Noida';

// ------------------------------------------------------------
// 6. Orders (12)
// ------------------------------------------------------------
MERGE (o1:Order {id: 'O01'}) ON CREATE SET o1.timestamp = '2026-09-10T12:30:00Z', o1.status = 'COMPLETED';
MERGE (o2:Order {id: 'O02'}) ON CREATE SET o2.timestamp = '2026-09-10T13:15:00Z', o2.status = 'COMPLETED';
MERGE (o3:Order {id: 'O03'}) ON CREATE SET o3.timestamp = '2026-09-10T14:00:00Z', o3.status = 'COMPLETED';
MERGE (o4:Order {id: 'O04'}) ON CREATE SET o4.timestamp = '2026-09-10T14:45:00Z', o4.status = 'COMPLETED';
MERGE (o5:Order {id: 'O05'}) ON CREATE SET o5.timestamp = '2026-09-10T18:30:00Z', o5.status = 'COMPLETED';
MERGE (o6:Order {id: 'O06'}) ON CREATE SET o6.timestamp = '2026-09-10T19:00:00Z', o6.status = 'COMPLETED';
MERGE (o7:Order {id: 'O07'}) ON CREATE SET o7.timestamp = '2026-09-10T19:30:00Z', o7.status = 'COMPLETED';
MERGE (o8:Order {id: 'O08'}) ON CREATE SET o8.timestamp = '2026-09-10T20:15:00Z', o8.status = 'COMPLETED';
MERGE (o9:Order {id: 'O09'}) ON CREATE SET o9.timestamp = '2026-09-10T20:45:00Z', o9.status = 'COMPLETED';
MERGE (o10:Order {id: 'O10'}) ON CREATE SET o10.timestamp = '2026-09-10T21:00:00Z', o10.status = 'COMPLETED';
MERGE (o11:Order {id: 'O11'}) ON CREATE SET o11.timestamp = '2026-09-10T21:30:00Z', o11.status = 'COMPLETED';
MERGE (o12:Order {id: 'O12'}) ON CREATE SET o12.timestamp = '2026-09-10T22:00:00Z', o12.status = 'COMPLETED';

// ------------------------------------------------------------
// 7. Ingredients (6 core ingredients)
// ------------------------------------------------------------
MERGE (i1:Ingredient {id: 'I001'}) ON CREATE SET i1.name = 'Paneer', i1.category = 'Dairy', i1.unit = 'kg';
MERGE (i2:Ingredient {id: 'I002'}) ON CREATE SET i2.name = 'Tomato', i2.category = 'Vegetable', i2.unit = 'kg';
MERGE (i3:Ingredient {id: 'I003'}) ON CREATE SET i3.name = 'Wheat Flour', i3.category = 'Grain', i3.unit = 'kg';
MERGE (i4:Ingredient {id: 'I004'}) ON CREATE SET i4.name = 'Milk', i4.category = 'Dairy', i4.unit = 'liter';
MERGE (i5:Ingredient {id: 'I005'}) ON CREATE SET i5.name = 'Butter', i5.category = 'Dairy', i5.unit = 'kg';
MERGE (i6:Ingredient {id: 'I006'}) ON CREATE SET i6.name = 'Spinach', i6.category = 'Vegetable', i6.unit = 'kg';

// ------------------------------------------------------------
// 8. Recipes (Dish-to-Ingredient mappings)
// ------------------------------------------------------------
// D01 - Tomato Soup uses Tomato
MERGE (r1:Recipe {id: 'R_D01_I002'}) ON CREATE SET r1.dish_id = 'D01', r1.ingredient_id = 'I002', r1.quantity_per_serving = 0.3, r1.unit = 'kg', r1.is_required = true;

// D02 - Margherita Pizza uses Wheat Flour
MERGE (r2:Recipe {id: 'R_D02_I003'}) ON CREATE SET r2.dish_id = 'D02', r2.ingredient_id = 'I003', r2.quantity_per_serving = 0.25, r2.unit = 'kg', r2.is_required = true;

// D03 - Paneer Tikka uses Paneer
MERGE (r3:Recipe {id: 'R_D03_I001'}) ON CREATE SET r3.dish_id = 'D03', r3.ingredient_id = 'I001', r3.quantity_per_serving = 0.15, r3.unit = 'kg', r3.is_required = true;

// D04 - Kadai Paneer uses Paneer
MERGE (r4:Recipe {id: 'R_D04_I001'}) ON CREATE SET r4.dish_id = 'D04', r4.ingredient_id = 'I001', r4.quantity_per_serving = 0.2, r4.unit = 'kg', r4.is_required = true;

// D05 - Paneer Butter Masala uses Paneer and Butter
MERGE (r5:Recipe {id: 'R_D05_I001'}) ON CREATE SET r5.dish_id = 'D05', r5.ingredient_id = 'I001', r5.quantity_per_serving = 0.2, r5.unit = 'kg', r5.is_required = true;
MERGE (r5b:Recipe {id: 'R_D05_I005'}) ON CREATE SET r5b.dish_id = 'D05', r5b.ingredient_id = 'I005', r5b.quantity_per_serving = 0.05, r5b.unit = 'kg', r5b.is_required = true;

// D06 - Tandoori Roti uses Wheat Flour
MERGE (r6:Recipe {id: 'R_D06_I003'}) ON CREATE SET r6.dish_id = 'D06', r6.ingredient_id = 'I003', r6.quantity_per_serving = 0.08, r6.unit = 'kg', r6.is_required = true;

// D07 - Dal Makhani uses Butter and Milk
MERGE (r7a:Recipe {id: 'R_D07_I005'}) ON CREATE SET r7a.dish_id = 'D07', r7a.ingredient_id = 'I005', r7a.quantity_per_serving = 0.03, r7a.unit = 'kg', r7a.is_required = true;
MERGE (r7b:Recipe {id: 'R_D07_I004'}) ON CREATE SET r7b.dish_id = 'D07', r7b.ingredient_id = 'I004', r7b.quantity_per_serving = 0.1, r7b.unit = 'liter', r7b.is_required = true;

// D08 - Palak Paneer uses Paneer and Spinach
MERGE (r8a:Recipe {id: 'R_D08_I001'}) ON CREATE SET r8a.dish_id = 'D08', r8a.ingredient_id = 'I001', r8a.quantity_per_serving = 0.18, r8a.unit = 'kg', r8a.is_required = true;
MERGE (r8b:Recipe {id: 'R_D08_I006'}) ON CREATE SET r8b.dish_id = 'D08', r8b.ingredient_id = 'I006', r8b.quantity_per_serving = 0.2, r8b.unit = 'kg', r8b.is_required = true;

// ------------------------------------------------------------
// 9. Inventory (Kitchen-level stock with quantities) - Enhanced with lifecycle tracking
// ------------------------------------------------------------
// Status values: AVAILABLE, FLAGGED, QUARANTINED, RECALLED, VERIFIED
// Each status change includes timestamp and reason

// B001 (Tomatoes) to K01: 500kg total
MERGE (inv1:Inventory {id: 'INV_B001_K01'}) ON CREATE SET 
  inv1.batch_id = 'B001', inv1.kitchen_id = 'K01', inv1.ingredient_id = 'I002',
  inv1.received_quantity = 500.0, inv1.consumed_quantity = 400.0, inv1.remaining_quantity = 100.0,
  inv1.unit = 'kg', 
  inv1.status = 'AVAILABLE',
  inv1.status_updated_at = '2026-09-01T09:00:00Z',
  inv1.status_reason = 'Received and stored - passed incoming inspection';

// B002 (Paneer) to K01: 100kg
MERGE (inv2:Inventory {id: 'INV_B002_K01'}) ON CREATE SET 
  inv2.batch_id = 'B002', inv2.kitchen_id = 'K01', inv2.ingredient_id = 'I001',
  inv2.received_quantity = 100.0, inv2.consumed_quantity = 80.0, inv2.remaining_quantity = 20.0,
  inv2.unit = 'kg', 
  inv2.status = 'AVAILABLE',
  inv2.status_updated_at = '2026-09-05T11:00:00Z',
  inv2.status_reason = 'Received and stored - passed incoming inspection';

// B002 (Paneer) to K02: 100kg
MERGE (inv3:Inventory {id: 'INV_B002_K02'}) ON CREATE SET 
  inv3.batch_id = 'B002', inv3.kitchen_id = 'K02', inv3.ingredient_id = 'I001',
  inv3.received_quantity = 100.0, inv3.consumed_quantity = 70.0, inv3.remaining_quantity = 30.0,
  inv3.unit = 'kg', 
  inv3.status = 'AVAILABLE',
  inv3.status_updated_at = '2026-09-05T11:30:00Z',
  inv3.status_reason = 'Received and stored - passed incoming inspection';

// B003 (Wheat Flour) to K03: 1000kg
MERGE (inv4:Inventory {id: 'INV_B003_K03'}) ON CREATE SET 
  inv4.batch_id = 'B003', inv4.kitchen_id = 'K03', inv4.ingredient_id = 'I003',
  inv4.received_quantity = 1000.0, inv4.consumed_quantity = 800.0, inv4.remaining_quantity = 200.0,
  inv4.unit = 'kg', 
  inv4.status = 'AVAILABLE',
  inv4.status_updated_at = '2026-08-25T10:00:00Z',
  inv4.status_reason = 'Received and stored - passed incoming inspection';

// B004 (Milk) to K03: 300L
MERGE (inv5:Inventory {id: 'INV_B004_K03'}) ON CREATE SET 
  inv5.batch_id = 'B004', inv5.kitchen_id = 'K03', inv5.ingredient_id = 'I004',
  inv5.received_quantity = 300.0, inv5.consumed_quantity = 250.0, inv5.remaining_quantity = 50.0,
  inv5.unit = 'liter', 
  inv5.status = 'AVAILABLE',
  inv5.status_updated_at = '2026-09-06T08:00:00Z',
  inv5.status_reason = 'Received and stored - passed incoming inspection';

// B005 (Butter) to K04: 150kg
MERGE (inv6:Inventory {id: 'INV_B005_K04'}) ON CREATE SET 
  inv6.batch_id = 'B005', inv6.kitchen_id = 'K04', inv6.ingredient_id = 'I005',
  inv6.received_quantity = 150.0, inv6.consumed_quantity = 120.0, inv6.remaining_quantity = 30.0,
  inv6.unit = 'kg', 
  inv6.status = 'AVAILABLE',
  inv6.status_updated_at = '2026-09-01T12:00:00Z',
  inv6.status_reason = 'Received and stored - passed incoming inspection';

// B006 (Spinach) to K04: 100kg
MERGE (inv7:Inventory {id: 'INV_B006_K04'}) ON CREATE SET 
  inv7.batch_id = 'B006', inv7.kitchen_id = 'K04', inv7.ingredient_id = 'I006',
  inv7.received_quantity = 100.0, inv7.consumed_quantity = 80.0, inv7.remaining_quantity = 20.0,
  inv7.unit = 'kg', 
  inv7.status = 'AVAILABLE',
  inv7.status_updated_at = '2026-09-07T07:30:00Z',
  inv7.status_reason = 'Received and stored - passed incoming inspection';

// ------------------------------------------------------------
// 10. Relationships
// ------------------------------------------------------------
// SUPPLIES: (Supplier)-[:SUPPLIES]->(Batch)
MATCH (s1:Supplier {id: 'S001'}), (b1:Batch {id: 'B001'}) MERGE (s1)-[:SUPPLIES]->(b1);
MATCH (s1:Supplier {id: 'S001'}), (b2:Batch {id: 'B002'}) MERGE (s1)-[:SUPPLIES]->(b2);
MATCH (s1:Supplier {id: 'S001'}), (b3:Batch {id: 'B003'}) MERGE (s1)-[:SUPPLIES]->(b3);
MATCH (s2:Supplier {id: 'S002'}), (b4:Batch {id: 'B004'}) MERGE (s2)-[:SUPPLIES]->(b4);
MATCH (s2:Supplier {id: 'S002'}), (b5:Batch {id: 'B005'}) MERGE (s2)-[:SUPPLIES]->(b5);
MATCH (s3:Supplier {id: 'S003'}), (b6:Batch {id: 'B006'}) MERGE (s3)-[:SUPPLIES]->(b6);

// DELIVERED_TO: (Batch)-[:DELIVERED_TO]->(Kitchen)
MATCH (b1:Batch {id: 'B001'}), (k1:Kitchen {id: 'K01'}) MERGE (b1)-[:DELIVERED_TO]->(k1);
MATCH (b2:Batch {id: 'B002'}), (k1:Kitchen {id: 'K01'}) MERGE (b2)-[:DELIVERED_TO]->(k1);
MATCH (b2:Batch {id: 'B002'}), (k2:Kitchen {id: 'K02'}) MERGE (b2)-[:DELIVERED_TO]->(k2);
MATCH (b3:Batch {id: 'B003'}), (k3:Kitchen {id: 'K03'}) MERGE (b3)-[:DELIVERED_TO]->(k3);
MATCH (b4:Batch {id: 'B004'}), (k3:Kitchen {id: 'K03'}) MERGE (b4)-[:DELIVERED_TO]->(k3);
MATCH (b5:Batch {id: 'B005'}), (k4:Kitchen {id: 'K04'}) MERGE (b5)-[:DELIVERED_TO]->(k4);
MATCH (b6:Batch {id: 'B006'}), (k4:Kitchen {id: 'K04'}) MERGE (b6)-[:DELIVERED_TO]->(k4);

// USED_IN: (Kitchen)-[:USED_IN]->(Dish)
MATCH (k1:Kitchen {id: 'K01'}), (d1:Dish {id: 'D01'}) MERGE (k1)-[:USED_IN]->(d1);
MATCH (k1:Kitchen {id: 'K01'}), (d2:Dish {id: 'D02'}) MERGE (k1)-[:USED_IN]->(d2);
MATCH (k1:Kitchen {id: 'K01'}), (d3:Dish {id: 'D03'}) MERGE (k1)-[:USED_IN]->(d3);
MATCH (k2:Kitchen {id: 'K02'}), (d4:Dish {id: 'D04'}) MERGE (k2)-[:USED_IN]->(d4);
MATCH (k2:Kitchen {id: 'K02'}), (d5:Dish {id: 'D05'}) MERGE (k2)-[:USED_IN]->(d5);
MATCH (k3:Kitchen {id: 'K03'}), (d6:Dish {id: 'D06'}) MERGE (k3)-[:USED_IN]->(d6);
MATCH (k3:Kitchen {id: 'K03'}), (d7:Dish {id: 'D07'}) MERGE (k3)-[:USED_IN]->(d7);
MATCH (k4:Kitchen {id: 'K04'}), (d8:Dish {id: 'D08'}) MERGE (k4)-[:USED_IN]->(d8);

// ORDERED_AS: (Order)-[:ORDERED_AS]->(Dish)
MATCH (o1:Order {id: 'O01'}), (d1:Dish {id: 'D01'}) MERGE (o1)-[:ORDERED_AS]->(d1);
MATCH (o2:Order {id: 'O02'}), (d2:Dish {id: 'D02'}) MERGE (o2)-[:ORDERED_AS]->(d2);
MATCH (o3:Order {id: 'O03'}), (d3:Dish {id: 'D03'}) MERGE (o3)-[:ORDERED_AS]->(d3);
MATCH (o4:Order {id: 'O04'}), (d3:Dish {id: 'D03'}) MERGE (o4)-[:ORDERED_AS]->(d3);
MATCH (o5:Order {id: 'O05'}), (d4:Dish {id: 'D04'}) MERGE (o5)-[:ORDERED_AS]->(d4);
MATCH (o6:Order {id: 'O06'}), (d4:Dish {id: 'D04'}) MERGE (o6)-[:ORDERED_AS]->(d4);
MATCH (o7:Order {id: 'O07'}), (d5:Dish {id: 'D05'}) MERGE (o7)-[:ORDERED_AS]->(d5);
MATCH (o8:Order {id: 'O08'}), (d6:Dish {id: 'D06'}) MERGE (o8)-[:ORDERED_AS]->(d6);
MATCH (o9:Order {id: 'O09'}), (d7:Dish {id: 'D07'}) MERGE (o9)-[:ORDERED_AS]->(d7);
MATCH (o10:Order {id: 'O10'}), (d7:Dish {id: 'D07'}) MERGE (o10)-[:ORDERED_AS]->(d7);
MATCH (o11:Order {id: 'O11'}), (d8:Dish {id: 'D08'}) MERGE (o11)-[:ORDERED_AS]->(d8);
MATCH (o12:Order {id: 'O12'}), (d8:Dish {id: 'D08'}) MERGE (o12)-[:ORDERED_AS]->(d8);

// PLACED_BY: (Order)-[:PLACED_BY]->(Customer)
MATCH (o1:Order {id: 'O01'}), (c1:Customer {id: 'C01'}) MERGE (o1)-[:PLACED_BY]->(c1);
MATCH (o2:Order {id: 'O02'}), (c2:Customer {id: 'C02'}) MERGE (o2)-[:PLACED_BY]->(c2);
MATCH (o3:Order {id: 'O03'}), (c3:Customer {id: 'C03'}) MERGE (o3)-[:PLACED_BY]->(c3);
MATCH (o4:Order {id: 'O04'}), (c4:Customer {id: 'C04'}) MERGE (o4)-[:PLACED_BY]->(c4);
MATCH (o5:Order {id: 'O05'}), (c5:Customer {id: 'C05'}) MERGE (o5)-[:PLACED_BY]->(c5);
MATCH (o6:Order {id: 'O06'}), (c6:Customer {id: 'C06'}) MERGE (o6)-[:PLACED_BY]->(c6);
MATCH (o7:Order {id: 'O07'}), (c7:Customer {id: 'C07'}) MERGE (o7)-[:PLACED_BY]->(c7);
MATCH (o8:Order {id: 'O08'}), (c8:Customer {id: 'C08'}) MERGE (o8)-[:PLACED_BY]->(c8);
MATCH (o9:Order {id: 'O09'}), (c9:Customer {id: 'C09'}) MERGE (o9)-[:PLACED_BY]->(c9);
MATCH (o10:Order {id: 'O10'}), (c10:Customer {id: 'C10'}) MERGE (o10)-[:PLACED_BY]->(c10);
MATCH (o11:Order {id: 'O11'}), (c1:Customer {id: 'C01'}) MERGE (o11)-[:PLACED_BY]->(c1);
MATCH (o12:Order {id: 'O12'}), (c2:Customer {id: 'C02'}) MERGE (o12)-[:PLACED_BY]->(c2);

// ------------------------------------------------------------
// NEW RELATIONSHIPS FOR ENHANCED MODEL
// ------------------------------------------------------------

// CONTAINS_INGREDIENT: (Batch)-[:CONTAINS_INGREDIENT]->(Ingredient)
MATCH (b1:Batch {id: 'B001'}), (i2:Ingredient {id: 'I002'}) MERGE (b1)-[:CONTAINS_INGREDIENT]->(i2);
MATCH (b2:Batch {id: 'B002'}), (i1:Ingredient {id: 'I001'}) MERGE (b2)-[:CONTAINS_INGREDIENT]->(i1);
MATCH (b3:Batch {id: 'B003'}), (i3:Ingredient {id: 'I003'}) MERGE (b3)-[:CONTAINS_INGREDIENT]->(i3);
MATCH (b4:Batch {id: 'B004'}), (i4:Ingredient {id: 'I004'}) MERGE (b4)-[:CONTAINS_INGREDIENT]->(i4);
MATCH (b5:Batch {id: 'B005'}), (i5:Ingredient {id: 'I005'}) MERGE (b5)-[:CONTAINS_INGREDIENT]->(i5);
MATCH (b6:Batch {id: 'B006'}), (i6:Ingredient {id: 'I006'}) MERGE (b6)-[:CONTAINS_INGREDIENT]->(i6);

// HAS_INVENTORY: (Kitchen)-[:HAS_INVENTORY]->(Inventory)
MATCH (k1:Kitchen {id: 'K01'}), (inv1:Inventory {id: 'INV_B001_K01'}) MERGE (k1)-[:HAS_INVENTORY]->(inv1);
MATCH (k1:Kitchen {id: 'K01'}), (inv2:Inventory {id: 'INV_B002_K01'}) MERGE (k1)-[:HAS_INVENTORY]->(inv2);
MATCH (k2:Kitchen {id: 'K02'}), (inv3:Inventory {id: 'INV_B002_K02'}) MERGE (k2)-[:HAS_INVENTORY]->(inv3);
MATCH (k3:Kitchen {id: 'K03'}), (inv4:Inventory {id: 'INV_B003_K03'}) MERGE (k3)-[:HAS_INVENTORY]->(inv4);
MATCH (k3:Kitchen {id: 'K03'}), (inv5:Inventory {id: 'INV_B004_K03'}) MERGE (k3)-[:HAS_INVENTORY]->(inv5);
MATCH (k4:Kitchen {id: 'K04'}), (inv6:Inventory {id: 'INV_B005_K04'}) MERGE (k4)-[:HAS_INVENTORY]->(inv6);
MATCH (k4:Kitchen {id: 'K04'}), (inv7:Inventory {id: 'INV_B006_K04'}) MERGE (k4)-[:HAS_INVENTORY]->(inv7);

// SOURCED_FROM: (Inventory)-[:SOURCED_FROM]->(Batch)
MATCH (inv1:Inventory {id: 'INV_B001_K01'}), (b1:Batch {id: 'B001'}) MERGE (inv1)-[:SOURCED_FROM]->(b1);
MATCH (inv2:Inventory {id: 'INV_B002_K01'}), (b2:Batch {id: 'B002'}) MERGE (inv2)-[:SOURCED_FROM]->(b2);
MATCH (inv3:Inventory {id: 'INV_B002_K02'}), (b2:Batch {id: 'B002'}) MERGE (inv3)-[:SOURCED_FROM]->(b2);
MATCH (inv4:Inventory {id: 'INV_B003_K03'}), (b3:Batch {id: 'B003'}) MERGE (inv4)-[:SOURCED_FROM]->(b3);
MATCH (inv5:Inventory {id: 'INV_B004_K03'}), (b4:Batch {id: 'B004'}) MERGE (inv5)-[:SOURCED_FROM]->(b4);
MATCH (inv6:Inventory {id: 'INV_B005_K04'}), (b5:Batch {id: 'B005'}) MERGE (inv6)-[:SOURCED_FROM]->(b5);
MATCH (inv7:Inventory {id: 'INV_B006_K04'}), (b6:Batch {id: 'B006'}) MERGE (inv7)-[:SOURCED_FROM]->(b6);

// CONTAINS: (Inventory)-[:CONTAINS]->(Ingredient)
MATCH (inv1:Inventory {id: 'INV_B001_K01'}), (i2:Ingredient {id: 'I002'}) MERGE (inv1)-[:CONTAINS]->(i2);
MATCH (inv2:Inventory {id: 'INV_B002_K01'}), (i1:Ingredient {id: 'I001'}) MERGE (inv2)-[:CONTAINS]->(i1);
MATCH (inv3:Inventory {id: 'INV_B002_K02'}), (i1:Ingredient {id: 'I001'}) MERGE (inv3)-[:CONTAINS]->(i1);
MATCH (inv4:Inventory {id: 'INV_B003_K03'}), (i3:Ingredient {id: 'I003'}) MERGE (inv4)-[:CONTAINS]->(i3);
MATCH (inv5:Inventory {id: 'INV_B004_K03'}), (i4:Ingredient {id: 'I004'}) MERGE (inv5)-[:CONTAINS]->(i4);
MATCH (inv6:Inventory {id: 'INV_B005_K04'}), (i5:Ingredient {id: 'I005'}) MERGE (inv6)-[:CONTAINS]->(i5);
MATCH (inv7:Inventory {id: 'INV_B006_K04'}), (i6:Ingredient {id: 'I006'}) MERGE (inv7)-[:CONTAINS]->(i6);

// HAS_RECIPE: (Dish)-[:HAS_RECIPE]->(Recipe)
MATCH (d1:Dish {id: 'D01'}), (r1:Recipe {id: 'R_D01_I002'}) MERGE (d1)-[:HAS_RECIPE]->(r1);
MATCH (d2:Dish {id: 'D02'}), (r2:Recipe {id: 'R_D02_I003'}) MERGE (d2)-[:HAS_RECIPE]->(r2);
MATCH (d3:Dish {id: 'D03'}), (r3:Recipe {id: 'R_D03_I001'}) MERGE (d3)-[:HAS_RECIPE]->(r3);
MATCH (d4:Dish {id: 'D04'}), (r4:Recipe {id: 'R_D04_I001'}) MERGE (d4)-[:HAS_RECIPE]->(r4);
MATCH (d5:Dish {id: 'D05'}), (r5:Recipe {id: 'R_D05_I001'}) MERGE (d5)-[:HAS_RECIPE]->(r5);
MATCH (d5:Dish {id: 'D05'}), (r5b:Recipe {id: 'R_D05_I005'}) MERGE (d5)-[:HAS_RECIPE]->(r5b);
MATCH (d6:Dish {id: 'D06'}), (r6:Recipe {id: 'R_D06_I003'}) MERGE (d6)-[:HAS_RECIPE]->(r6);
MATCH (d7:Dish {id: 'D07'}), (r7a:Recipe {id: 'R_D07_I005'}) MERGE (d7)-[:HAS_RECIPE]->(r7a);
MATCH (d7:Dish {id: 'D07'}), (r7b:Recipe {id: 'R_D07_I004'}) MERGE (d7)-[:HAS_RECIPE]->(r7b);
MATCH (d8:Dish {id: 'D08'}), (r8a:Recipe {id: 'R_D08_I001'}) MERGE (d8)-[:HAS_RECIPE]->(r8a);
MATCH (d8:Dish {id: 'D08'}), (r8b:Recipe {id: 'R_D08_I006'}) MERGE (d8)-[:HAS_RECIPE]->(r8b);

// REQUIRES: (Recipe)-[:REQUIRES]->(Ingredient)
MATCH (r1:Recipe {id: 'R_D01_I002'}), (i2:Ingredient {id: 'I002'}) MERGE (r1)-[:REQUIRES]->(i2);
MATCH (r2:Recipe {id: 'R_D02_I003'}), (i3:Ingredient {id: 'I003'}) MERGE (r2)-[:REQUIRES]->(i3);
MATCH (r3:Recipe {id: 'R_D03_I001'}), (i1:Ingredient {id: 'I001'}) MERGE (r3)-[:REQUIRES]->(i1);
MATCH (r4:Recipe {id: 'R_D04_I001'}), (i1:Ingredient {id: 'I001'}) MERGE (r4)-[:REQUIRES]->(i1);
MATCH (r5:Recipe {id: 'R_D05_I001'}), (i1:Ingredient {id: 'I001'}) MERGE (r5)-[:REQUIRES]->(i1);
MATCH (r5b:Recipe {id: 'R_D05_I005'}), (i5:Ingredient {id: 'I005'}) MERGE (r5b)-[:REQUIRES]->(i5);
MATCH (r6:Recipe {id: 'R_D06_I003'}), (i3:Ingredient {id: 'I003'}) MERGE (r6)-[:REQUIRES]->(i3);
MATCH (r7a:Recipe {id: 'R_D07_I005'}), (i5:Ingredient {id: 'I005'}) MERGE (r7a)-[:REQUIRES]->(i5);
MATCH (r7b:Recipe {id: 'R_D07_I004'}), (i4:Ingredient {id: 'I004'}) MERGE (r7b)-[:REQUIRES]->(i4);
MATCH (r8a:Recipe {id: 'R_D08_I001'}), (i1:Ingredient {id: 'I001'}) MERGE (r8a)-[:REQUIRES]->(i1);
MATCH (r8b:Recipe {id: 'R_D08_I006'}), (i6:Ingredient {id: 'I006'}) MERGE (r8b)-[:REQUIRES]->(i6);

// ------------------------------------------------------------
// 8. Verification queries (Reference only)
// ------------------------------------------------------------
// // Total counts by label
// MATCH (n) RETURN labels(n) AS Label, count(n) AS Count;
//
// // Total relationship counts by type
// MATCH ()-[r]->() RETURN type(r) AS RelationshipType, count(r) AS Count;
//
// // B002 downstream impact
// MATCH (b:Batch {id: 'B002'})-[:DELIVERED_TO]->(k:Kitchen)-[:USED_IN]->(d:Dish)<-[:ORDERED_AS]-(o:Order)-[:PLACED_BY]->(c:Customer) 
// RETURN b, k, d, o, c;
//
// // S001 downstream batch count
// MATCH (s:Supplier {id: 'S001'})-[:SUPPLIES]->(b:Batch) 
// RETURN s.id AS Supplier, count(b) AS BatchCount;
