// ============================================================
// INFOMETRACE - STATUS LIFECYCLE TRANSITIONS
// ============================================================
// Purpose: Example queries for updating entity status with
// full audit trail. Use these patterns for recall workflows.
// ============================================================

// ------------------------------------------------------------
// BATCH STATUS TRANSITIONS
// ------------------------------------------------------------
// Valid states: SAFE → FLAGGED → QUARANTINED → RECALLED/VERIFIED

// Example: Flag B002 for investigation (suspected contamination)
MATCH (b:Batch {id: 'B002'})
SET b.status = 'FLAGGED',
    b.status_updated_at = datetime(),
    b.status_reason = 'Customer illness reported - bacterial contamination suspected',
    b.flagged_at = datetime(),
    b.flagged_by = 'System Alert'
RETURN b.id AS batch_id, b.status AS new_status, b.status_reason AS reason;

// Example: Quarantine B002 (lab test confirms contamination)
MATCH (b:Batch {id: 'B002'})
SET b.status = 'QUARANTINED',
    b.status_updated_at = datetime(),
    b.status_reason = 'Lab confirmed: E.coli contamination detected in supplier facility',
    b.quarantined_at = datetime(),
    b.quarantined_by = 'Quality Manager - Ravi Kumar'
RETURN b.id AS batch_id, b.status AS new_status, b.status_reason AS reason;

// Example: Recall B002 (official recall issued)
MATCH (b:Batch {id: 'B002'})
SET b.status = 'RECALLED',
    b.status_updated_at = datetime(),
    b.status_reason = 'Official recall issued - FSSAI notification #2026-09-456',
    b.recalled_at = datetime(),
    b.recalled_by = 'Regional Manager - Priya Sharma',
    b.recall_notification_id = 'FSSAI-2026-09-456'
RETURN b.id AS batch_id, b.status AS new_status, b.status_reason AS reason;

// Example: Verify B001 after re-inspection (false alarm)
MATCH (b:Batch {id: 'B001'})
SET b.status = 'VERIFIED',
    b.status_updated_at = datetime(),
    b.status_reason = 'Re-inspection completed - no contamination found, safe for use',
    b.verified_at = datetime(),
    b.verified_by = 'Lab Technician - Amit Das'
RETURN b.id AS batch_id, b.status AS new_status, b.status_reason AS reason;


// ------------------------------------------------------------
// INVENTORY STATUS TRANSITIONS
// ------------------------------------------------------------
// Valid states: AVAILABLE → FLAGGED → QUARANTINED → RECALLED/VERIFIED

// Example: Flag all inventory from B002 (cascade from batch status)
MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
SET inv.status = 'FLAGGED',
    inv.status_updated_at = datetime(),
    inv.status_reason = 'Source batch B002 flagged for contamination investigation',
    inv.flagged_at = datetime()
RETURN inv.id AS inventory_id, inv.kitchen_id AS kitchen, inv.remaining_quantity AS remaining_kg;

// Example: Quarantine all inventory from B002
MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
SET inv.status = 'QUARANTINED',
    inv.status_updated_at = datetime(),
    inv.status_reason = 'Source batch B002 quarantined - awaiting disposal instructions',
    inv.quarantined_at = datetime()
RETURN inv.id AS inventory_id, inv.kitchen_id AS kitchen, inv.remaining_quantity AS remaining_kg;

// Example: Recall all inventory from B002
MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
SET inv.status = 'RECALLED',
    inv.status_updated_at = datetime(),
    inv.status_reason = 'Source batch B002 officially recalled - immediate disposal required',
    inv.recalled_at = datetime()
RETURN inv.id AS inventory_id, inv.kitchen_id AS kitchen, inv.remaining_quantity AS remaining_kg;

// Example: Verify safe inventory after false alarm
MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: 'B001'})
SET inv.status = 'VERIFIED',
    inv.status_updated_at = datetime(),
    inv.status_reason = 'Source batch B001 verified safe - cleared for continued use',
    inv.verified_at = datetime()
RETURN inv.id AS inventory_id, inv.kitchen_id AS kitchen, inv.remaining_quantity AS remaining_kg;


// ------------------------------------------------------------
// DISH STATUS TRANSITIONS
// ------------------------------------------------------------
// Valid states: AVAILABLE → FLAGGED → SUSPENDED → VERIFIED

// Example: Flag dishes using contaminated paneer (B002)
MATCH (d:Dish)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(i:Ingredient {id: 'I001'}),
      (inv:Inventory {status: 'FLAGGED'})-[:CONTAINS]->(i),
      (inv)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
WHERE (d)-[:HAS_RECIPE]->()-[:REQUIRES]->(i)
SET d.status = 'FLAGGED',
    d.status_updated_at = datetime(),
    d.status_reason = 'Contains paneer from flagged batch B002 - investigation ongoing',
    d.flagged_at = datetime()
RETURN d.id AS dish_id, d.name AS dish_name, d.status AS new_status;

// Example: Suspend dishes (remove from menu)
MATCH (d:Dish)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(i:Ingredient {id: 'I001'}),
      (inv:Inventory {status: 'QUARANTINED'})-[:CONTAINS]->(i),
      (inv)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
WHERE (d)-[:HAS_RECIPE]->()-[:REQUIRES]->(i)
SET d.status = 'SUSPENDED',
    d.status_updated_at = datetime(),
    d.status_reason = 'Contains paneer from recalled batch B002 - removed from menu',
    d.suspended_at = datetime()
RETURN d.id AS dish_id, d.name AS dish_name, d.status AS new_status;

// Example: Verify dishes cleared (false alarm or new batch)
MATCH (d:Dish {status: 'FLAGGED'})
WHERE NOT EXISTS {
  MATCH (d)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(i:Ingredient),
        (inv:Inventory)-[:CONTAINS]->(i)
  WHERE inv.status IN ['FLAGGED', 'QUARANTINED', 'RECALLED']
}
SET d.status = 'VERIFIED',
    d.status_updated_at = datetime(),
    d.status_reason = 'All ingredients verified safe - cleared for service',
    d.verified_at = datetime()
RETURN d.id AS dish_id, d.name AS dish_name, d.status AS new_status;


// ------------------------------------------------------------
// RECALL WORKFLOW: Complete cascade example
// ------------------------------------------------------------
// Scenario: Supplier contamination discovered → Full recall workflow

// Step 1: Mark batch as recalled
MATCH (b:Batch {id: 'B002'})
SET b.status = 'RECALLED',
    b.status_updated_at = datetime(),
    b.status_reason = 'Supplier facility contamination - FSSAI mandatory recall',
    b.recalled_at = datetime(),
    b.recall_notification_id = 'FSSAI-2026-09-456';

// Step 2: Cascade to all inventory from that batch
MATCH (inv:Inventory)-[:SOURCED_FROM]->(b:Batch {id: 'B002'})
SET inv.status = 'RECALLED',
    inv.status_updated_at = datetime(),
    inv.status_reason = 'Source batch B002 recalled - disposal initiated',
    inv.recalled_at = datetime();

// Step 3: Suspend all dishes using the recalled ingredient
MATCH (d:Dish)-[:HAS_RECIPE]->(r:Recipe)-[:REQUIRES]->(i:Ingredient {id: 'I001'})
WHERE EXISTS {
  MATCH (inv:Inventory {status: 'RECALLED'})-[:CONTAINS]->(i)
  WHERE (inv)-[:SOURCED_FROM]->(:Batch {id: 'B002'})
}
SET d.status = 'SUSPENDED',
    d.status_updated_at = datetime(),
    d.status_reason = 'Contains ingredient from recalled batch B002',
    d.suspended_at = datetime();

// Step 4: Identify affected customers (for notification)
MATCH (b:Batch {id: 'B002', status: 'RECALLED'})-[:DELIVERED_TO]->(k:Kitchen),
      (k)-[:USED_IN]->(d:Dish)<-[:ORDERED_AS]-(o:Order)-[:PLACED_BY]->(c:Customer)
RETURN DISTINCT c.id AS customer_id, 
       c.name AS customer_name, 
       c.city AS city,
       collect(DISTINCT o.id) AS affected_orders,
       collect(DISTINCT d.name) AS affected_dishes
ORDER BY customer_name;


// ------------------------------------------------------------
// STATUS AUDIT QUERIES
// ------------------------------------------------------------

// View all current statuses across entity types
MATCH (n)
WHERE n.status IS NOT NULL
RETURN labels(n)[0] AS entity_type, 
       n.id AS entity_id, 
       n.status AS current_status,
       n.status_updated_at AS last_updated,
       n.status_reason AS reason
ORDER BY entity_type, n.status, n.id;

// Find all entities in non-normal states
MATCH (n)
WHERE n.status IN ['FLAGGED', 'QUARANTINED', 'RECALLED', 'SUSPENDED']
RETURN labels(n)[0] AS entity_type,
       n.id AS entity_id,
       n.status AS status,
       n.status_reason AS reason,
       n.status_updated_at AS timestamp
ORDER BY timestamp DESC;

// Calculate recall impact by status
MATCH (b:Batch {status: 'RECALLED'})-[:DELIVERED_TO]->(k:Kitchen)
OPTIONAL MATCH (inv:Inventory)-[:SOURCED_FROM]->(b)
OPTIONAL MATCH (k)-[:USED_IN]->(d:Dish)
OPTIONAL MATCH (d)<-[:ORDERED_AS]-(o:Order)
OPTIONAL MATCH (o)-[:PLACED_BY]->(c:Customer)
RETURN b.id AS recalled_batch,
       b.recalled_at AS recall_date,
       count(DISTINCT k) AS affected_kitchens,
       count(DISTINCT d) AS affected_dishes,
       count(DISTINCT o) AS affected_orders,
       count(DISTINCT c) AS affected_customers,
       sum(inv.remaining_quantity) AS remaining_contaminated_kg;
