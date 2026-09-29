// ============================================================
// INFOMETRACE - EXPANDED DEMO DATASET
// ============================================================
// Purpose: Comprehensive demo data for showcasing batch isolation,
// multi-supplier scenarios, and realistic recall simulations.
// Includes 5 suppliers, 18 batches, multiple paneer batches for
// testing contamination isolation capabilities.
// ============================================================

// ------------------------------------------------------------
// 1. Suppliers (5) - Diverse geographic coverage
// ------------------------------------------------------------
MERGE (s1:Supplier {id: 'S001'}) ON CREATE SET 
  s1.name = 'FreshFarm Organics', 
  s1.location = 'Haryana', 
  s1.certification = 'FSSAI-A+', 
  s1.status = 'ACTIVE',
  s1.contact = 'contact@freshfarm.in',
  s1.established = '2015';

MERGE (s2:Supplier {id: 'S002'}) ON CREATE SET 
  s2.name = 'Delhi Dairy Co.', 
  s2.location = 'Delhi', 
  s2.certification = 'FSSAI-B', 
  s2.status = 'ACTIVE',
  s2.contact = 'sales@delhidairy.co.in',
  s2.established = '2010';

MERGE (s3:Supplier {id: 'S003'}) ON CREATE SET 
  s3.name = 'Noida Greens', 
  s3.location = 'UP', 
  s3.certification = 'FSSAI-A', 
  s3.status = 'ACTIVE',
  s3.contact = 'orders@noidagreens.com',
  s3.established = '2018';

MERGE (s4:Supplier {id: 'S004'}) ON CREATE SET 
  s4.name = 'Punjab Paneer Palace', 
  s4.location = 'Punjab', 
  s4.certification = 'FSSAI-A+', 
  s4.status = 'ACTIVE',
  s4.contact = 'info@punjabpaneer.in',
  s4.established = '2012';

MERGE (s5:Supplier {id: 'S005'}) ON CREATE SET 
  s5.name = 'Rajasthan Spice Mills', 
  s5.location = 'Rajasthan', 
  s5.certification = 'FSSAI-A', 
  s5.status = 'ACTIVE',
  s5.contact = 'export@rajspice.co.in',
  s5.established = '2008';

// ------------------------------------------------------------
// 2. Batches (18) - Multiple batches per ingredient type
// ------------------------------------------------------------
// Tomatoes (3 batches from different suppliers)
MERGE (b1:Batch {id: 'B001'}) ON CREATE SET 
  b1.ingredient = 'Organic Tomatoes', 
  b1.quantity = 500, 
  b1.received_date = '2026-09-01', 
  b1.expiry_date = '2026-09-15', 
  b1.status = 'SAFE',
  b1.status_updated_at = '2026-09-01T08:00:00Z',
  b1.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b10:Batch {id: 'B010'}) ON CREATE SET 
  b10.ingredient = 'Cherry Tomatoes', 
  b10.quantity = 200, 
  b10.received_date = '2026-09-08', 
  b10.expiry_date = '2026-09-22', 
  b10.status = 'SAFE',
  b10.status_updated_at = '2026-09-08T09:00:00Z',
  b10.status_reason = 'Initial delivery - passed quality inspection';

// Paneer (5 batches from different suppliers - KEY FOR BATCH ISOLATION TESTING)
MERGE (b2:Batch {id: 'B002'}) ON CREATE SET 
  b2.ingredient = 'Paneer Block', 
  b2.quantity = 200, 
  b2.received_date = '2026-09-05', 
  b2.expiry_date = '2026-09-12', 
  b2.status = 'SAFE',
  b2.status_updated_at = '2026-09-05T10:30:00Z',
  b2.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b11:Batch {id: 'B011'}) ON CREATE SET 
  b11.ingredient = 'Paneer Cubes', 
  b11.quantity = 150, 
  b11.received_date = '2026-09-07', 
  b11.expiry_date = '2026-09-14', 
  b11.status = 'SAFE',
  b11.status_updated_at = '2026-09-07T11:00:00Z',
  b11.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b12:Batch {id: 'B012'}) ON CREATE SET 
  b12.ingredient = 'Paneer Block', 
  b12.quantity = 180, 
  b12.received_date = '2026-09-09', 
  b12.expiry_date = '2026-09-16', 
  b12.status = 'SAFE',
  b12.status_updated_at = '2026-09-09T10:00:00Z',
  b12.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b13:Batch {id: 'B013'}) ON CREATE SET 
  b13.ingredient = 'Low-Fat Paneer', 
  b13.quantity = 120, 
  b13.received_date = '2026-09-10', 
  b13.expiry_date = '2026-09-17', 
  b13.status = 'SAFE',
  b13.status_updated_at = '2026-09-10T09:30:00Z',
  b13.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b14:Batch {id: 'B014'}) ON CREATE SET 
  b14.ingredient = 'Paneer Block', 
  b14.quantity = 200, 
  b14.received_date = '2026-09-11', 
  b14.expiry_date = '2026-09-18', 
  b14.status = 'SAFE',
  b14.status_updated_at = '2026-09-11T08:30:00Z',
  b14.status_reason = 'Initial delivery - passed quality inspection';

// Wheat Flour (2 batches)
MERGE (b3:Batch {id: 'B003'}) ON CREATE SET 
  b3.ingredient = 'Wheat Flour', 
  b3.quantity = 1000, 
  b3.received_date = '2026-08-25', 
  b3.expiry_date = '2026-11-25', 
  b3.status = 'SAFE',
  b3.status_updated_at = '2026-08-25T09:00:00Z',
  b3.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b15:Batch {id: 'B015'}) ON CREATE SET 
  b15.ingredient = 'Whole Wheat Flour', 
  b15.quantity = 800, 
  b15.received_date = '2026-09-05', 
  b15.expiry_date = '2026-12-05', 
  b15.status = 'SAFE',
  b15.status_updated_at = '2026-09-05T10:00:00Z',
  b15.status_reason = 'Initial delivery - passed quality inspection';

// Milk (2 batches)
MERGE (b4:Batch {id: 'B004'}) ON CREATE SET 
  b4.ingredient = 'Full Cream Milk', 
  b4.quantity = 300, 
  b4.received_date = '2026-09-06', 
  b4.expiry_date = '2026-09-14', 
  b4.status = 'SAFE',
  b4.status_updated_at = '2026-09-06T07:00:00Z',
  b4.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b16:Batch {id: 'B016'}) ON CREATE SET 
  b16.ingredient = 'Toned Milk', 
  b16.quantity = 250, 
  b16.received_date = '2026-09-08', 
  b16.expiry_date = '2026-09-16', 
  b16.status = 'SAFE',
  b16.status_updated_at = '2026-09-08T07:30:00Z',
  b16.status_reason = 'Initial delivery - passed quality inspection';

// Butter (2 batches)
MERGE (b5:Batch {id: 'B005'}) ON CREATE SET 
  b5.ingredient = 'Butter', 
  b5.quantity = 150, 
  b5.received_date = '2026-09-01', 
  b5.expiry_date = '2026-10-01', 
  b5.status = 'SAFE',
  b5.status_updated_at = '2026-09-01T11:00:00Z',
  b5.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b17:Batch {id: 'B017'}) ON CREATE SET 
  b17.ingredient = 'Salted Butter', 
  b17.quantity = 100, 
  b17.received_date = '2026-09-07', 
  b17.expiry_date = '2026-10-07', 
  b17.status = 'SAFE',
  b17.status_updated_at = '2026-09-07T11:30:00Z',
  b17.status_reason = 'Initial delivery - passed quality inspection';

// Spinach (2 batches)
MERGE (b6:Batch {id: 'B006'}) ON CREATE SET 
  b6.ingredient = 'Spinach', 
  b6.quantity = 100, 
  b6.received_date = '2026-09-07', 
  b6.expiry_date = '2026-09-17', 
  b6.status = 'SAFE',
  b6.status_updated_at = '2026-09-07T06:30:00Z',
  b6.status_reason = 'Initial delivery - passed quality inspection';

MERGE (b18:Batch {id: 'B018'}) ON CREATE SET 
  b18.ingredient = 'Baby Spinach', 
  b18.quantity = 80, 
  b18.received_date = '2026-09-09', 
  b18.expiry_date = '2026-09-19', 
  b18.status = 'SAFE',
  b18.status_updated_at = '2026-09-09T07:00:00Z',
  b18.status_reason = 'Initial delivery - passed quality inspection';

// ------------------------------------------------------------
// 3. Batch-Supplier Relationships (diversified supply chain)
// ------------------------------------------------------------
// S001 (FreshFarm) supplies tomatoes and original batches
MATCH (s1:Supplier {id: 'S001'}), (b1:Batch {id: 'B001'}) MERGE (s1)-[:SUPPLIES]->(b1);
MATCH (s1:Supplier {id: 'S001'}), (b2:Batch {id: 'B002'}) MERGE (s1)-[:SUPPLIES]->(b2);
MATCH (s1:Supplier {id: 'S001'}), (b3:Batch {id: 'B003'}) MERGE (s1)-[:SUPPLIES]->(b3);

// S002 (Delhi Dairy) supplies dairy products
MATCH (s2:Supplier {id: 'S002'}), (b4:Batch {id: 'B004'}) MERGE (s2)-[:SUPPLIES]->(b4);
MATCH (s2:Supplier {id: 'S002'}), (b5:Batch {id: 'B005'}) MERGE (s2)-[:SUPPLIES]->(b5);
MATCH (s2:Supplier {id: 'S002'}), (b16:Batch {id: 'B016'}) MERGE (s2)-[:SUPPLIES]->(b16);
MATCH (s2:Supplier {id: 'S002'}), (b17:Batch {id: 'B017'}) MERGE (s2)-[:SUPPLIES]->(b17);

// S003 (Noida Greens) supplies vegetables
MATCH (s3:Supplier {id: 'S003'}), (b6:Batch {id: 'B006'}) MERGE (s3)-[:SUPPLIES]->(b6);
MATCH (s3:Supplier {id: 'S003'}), (b10:Batch {id: 'B010'}) MERGE (s3)-[:SUPPLIES]->(b10);
MATCH (s3:Supplier {id: 'S003'}), (b18:Batch {id: 'B018'}) MERGE (s3)-[:SUPPLIES]->(b18);

// S004 (Punjab Paneer) supplies multiple paneer batches - CRITICAL FOR TESTING
MATCH (s4:Supplier {id: 'S004'}), (b11:Batch {id: 'B011'}) MERGE (s4)-[:SUPPLIES]->(b11);
MATCH (s4:Supplier {id: 'S004'}), (b12:Batch {id: 'B012'}) MERGE (s4)-[:SUPPLIES]->(b12);
MATCH (s4:Supplier {id: 'S004'}), (b13:Batch {id: 'B013'}) MERGE (s4)-[:SUPPLIES]->(b13);
MATCH (s4:Supplier {id: 'S004'}), (b14:Batch {id: 'B014'}) MERGE (s4)-[:SUPPLIES]->(b14);

// S005 (Rajasthan Spice) supplies grains
MATCH (s5:Supplier {id: 'S005'}), (b15:Batch {id: 'B015'}) MERGE (s5)-[:SUPPLIES]->(b15);

// NOTE: Existing nodes (Kitchens, Dishes, Orders, Customers, Ingredients, 
// Recipes, Inventory) remain unchanged from seed.cypher.
// This file only adds new suppliers and batches for advanced testing scenarios.

// ============================================================
// TESTING SCENARIOS ENABLED BY THIS DATASET:
// ============================================================
// 1. BATCH ISOLATION: Compare B002 (contaminated) vs B011/B012/B013/B014 
//    (safe paneer from different supplier) to prove surgical targeting
// 2. MULTI-SUPPLIER IMPACT: Show S001 contamination doesn't affect S004 supply
// 3. INGREDIENT DIVERSITY: Multiple batches of same ingredient from different
//    suppliers demonstrate supply chain resilience
// 4. TEMPORAL ANALYSIS: Batch dates span 2 weeks for time-based queries
// 5. QUANTITY VARIATIONS: Batch sizes range 80kg-1000kg for realistic modeling
