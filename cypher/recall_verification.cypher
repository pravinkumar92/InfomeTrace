// ============================================================
// INFOMETRACE - RECALL VERIFICATION & ACTION TRACKING
// ============================================================
// Purpose: Track all actions taken during recall execution
// to prove closed-loop compliance. Creates audit trail for
// regulators showing disposal, customer notifications, and
// verification testing.
// ============================================================

// ------------------------------------------------------------
// Schema: RecallAction Node
// ------------------------------------------------------------
// Represents a specific action taken during recall execution
// Types: INVENTORY_DISPOSAL, CUSTOMER_NOTIFICATION, 
//        VERIFICATION_TEST, SUPPLIER_NOTIFICATION,
//        FACILITY_INSPECTION

CREATE CONSTRAINT recall_action_id_unique IF NOT EXISTS 
FOR (ra:RecallAction) REQUIRE ra.id IS UNIQUE;

// ------------------------------------------------------------
// Example: Create recall actions for B002
// ------------------------------------------------------------

// Action 1: Dispose contaminated inventory at K01
MERGE (ra1:RecallAction {id: 'RA_B002_001'}) ON CREATE SET
  ra1.action_type = 'INVENTORY_DISPOSAL',
  ra1.batch_id = 'B002',
  ra1.inventory_id = 'INV_B002_K01',
  ra1.kitchen_id = 'K01',
  ra1.quantity_disposed = 20.0,
  ra1.unit = 'kg',
  ra1.disposal_method = 'Incineration at authorized facility',
  ra1.disposal_receipt_id = 'DISPOSAL-2026-09-27-001',
  ra1.performed_by = 'Kitchen Manager - Rajesh Kumar',
  ra1.performed_at = '2026-09-27T10:00:00Z',
  ra1.verified_by = 'Quality Inspector - Meera Singh',
  ra1.verified_at = '2026-09-27T10:30:00Z',
  ra1.status = 'COMPLETED',
  ra1.notes = 'All remaining paneer stock from B002 destroyed under supervision';

// Action 2: Dispose contaminated inventory at K02
MERGE (ra2:RecallAction {id: 'RA_B002_002'}) ON CREATE SET
  ra2.action_type = 'INVENTORY_DISPOSAL',
  ra2.batch_id = 'B002',
  ra2.inventory_id = 'INV_B002_K02',
  ra2.kitchen_id = 'K02',
  ra2.quantity_disposed = 30.0,
  ra2.unit = 'kg',
  ra2.disposal_method = 'Incineration at authorized facility',
  ra2.disposal_receipt_id = 'DISPOSAL-2026-09-27-002',
  ra2.performed_by = 'Kitchen Manager - Anita Desai',
  ra2.performed_at = '2026-09-27T11:00:00Z',
  ra2.verified_by = 'Quality Inspector - Meera Singh',
  ra2.verified_at = '2026-09-27T11:30:00Z',
  ra2.status = 'COMPLETED',
  ra2.notes = 'All remaining paneer stock from B002 destroyed under supervision';

// Action 3-9: Customer notifications (7 customers)
MERGE (ra3:RecallAction {id: 'RA_B002_003'}) ON CREATE SET
  ra3.action_type = 'CUSTOMER_NOTIFICATION',
  ra3.batch_id = 'B002',
  ra3.customer_id = 'C03',
  ra3.notification_method = 'Email + SMS',
  ra3.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra3.performed_by = 'Customer Service - Automated System',
  ra3.performed_at = '2026-09-27T09:00:00Z',
  ra3.acknowledged_by_customer = true,
  ra3.acknowledged_at = '2026-09-27T09:15:00Z',
  ra3.status = 'COMPLETED',
  ra3.notes = 'Customer acknowledged receipt, no health concerns reported';

MERGE (ra4:RecallAction {id: 'RA_B002_004'}) ON CREATE SET
  ra4.action_type = 'CUSTOMER_NOTIFICATION',
  ra4.batch_id = 'B002',
  ra4.customer_id = 'C04',
  ra4.notification_method = 'Email + SMS',
  ra4.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra4.performed_by = 'Customer Service - Automated System',
  ra4.performed_at = '2026-09-27T09:00:00Z',
  ra4.acknowledged_by_customer = true,
  ra4.acknowledged_at = '2026-09-27T10:00:00Z',
  ra4.status = 'COMPLETED',
  ra4.notes = 'Customer acknowledged receipt, no health concerns reported';

MERGE (ra5:RecallAction {id: 'RA_B002_005'}) ON CREATE SET
  ra5.action_type = 'CUSTOMER_NOTIFICATION',
  ra5.batch_id = 'B002',
  ra5.customer_id = 'C05',
  ra5.notification_method = 'Email + SMS + Phone Call',
  ra5.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra5.performed_by = 'Customer Service - Manual Call',
  ra5.performed_at = '2026-09-27T09:30:00Z',
  ra5.acknowledged_by_customer = true,
  ra5.acknowledged_at = '2026-09-27T09:30:00Z',
  ra5.status = 'COMPLETED',
  ra5.notes = 'Phone call required, customer reported mild symptoms, referred to medical support';

MERGE (ra6:RecallAction {id: 'RA_B002_006'}) ON CREATE SET
  ra6.action_type = 'CUSTOMER_NOTIFICATION',
  ra6.batch_id = 'B002',
  ra6.customer_id = 'C06',
  ra6.notification_method = 'Email + SMS',
  ra6.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra6.performed_by = 'Customer Service - Automated System',
  ra6.performed_at = '2026-09-27T09:00:00Z',
  ra6.acknowledged_by_customer = false,
  ra6.acknowledged_at = null,
  ra6.status = 'PENDING_ACKNOWLEDGMENT',
  ra6.notes = 'Awaiting customer response';

MERGE (ra7:RecallAction {id: 'RA_B002_007'}) ON CREATE SET
  ra7.action_type = 'CUSTOMER_NOTIFICATION',
  ra7.batch_id = 'B002',
  ra7.customer_id = 'C07',
  ra7.notification_method = 'Email + SMS',
  ra7.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra7.performed_by = 'Customer Service - Automated System',
  ra7.performed_at = '2026-09-27T09:00:00Z',
  ra7.acknowledged_by_customer = true,
  ra7.acknowledged_at = '2026-09-27T09:20:00Z',
  ra7.status = 'COMPLETED',
  ra7.notes = 'Customer acknowledged receipt, no health concerns reported';

MERGE (ra8:RecallAction {id: 'RA_B002_008'}) ON CREATE SET
  ra8.action_type = 'CUSTOMER_NOTIFICATION',
  ra8.batch_id = 'B002',
  ra8.customer_id = 'C02',
  ra8.notification_method = 'Email + SMS',
  ra8.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra8.performed_by = 'Customer Service - Automated System',
  ra8.performed_at = '2026-09-27T09:00:00Z',
  ra8.acknowledged_by_customer = true,
  ra8.acknowledged_at = '2026-09-27T09:45:00Z',
  ra8.status = 'COMPLETED',
  ra8.notes = 'Customer acknowledged receipt, no health concerns reported';

MERGE (ra9:RecallAction {id: 'RA_B002_009'}) ON CREATE SET
  ra9.action_type = 'CUSTOMER_NOTIFICATION',
  ra9.batch_id = 'B002',
  ra9.customer_id = 'C01',
  ra9.notification_method = 'Email + SMS',
  ra9.notification_content = 'Food safety recall: Paneer dishes ordered on 2026-09-10 may contain contaminated product. Full refund issued. Contact support for medical concerns.',
  ra9.performed_by = 'Customer Service - Automated System',
  ra9.performed_at = '2026-09-27T09:00:00Z',
  ra9.acknowledged_by_customer = true,
  ra9.acknowledged_at = '2026-09-27T09:10:00Z',
  ra9.status = 'COMPLETED',
  ra9.notes = 'Customer acknowledged receipt, no health concerns reported';

// Action 10: Supplier facility inspection
MERGE (ra10:RecallAction {id: 'RA_B002_010'}) ON CREATE SET
  ra10.action_type = 'SUPPLIER_NOTIFICATION',
  ra10.batch_id = 'B002',
  ra10.supplier_id = 'S001',
  ra10.notification_method = 'Official Letter + Site Visit',
  ra10.performed_by = 'Supply Chain Manager - Vikram Patel',
  ra10.performed_at = '2026-09-27T08:00:00Z',
  ra10.status = 'COMPLETED',
  ra10.notes = 'Supplier notified of contamination. Facility inspection scheduled for 2026-09-28.';

// Action 11: Supplier facility inspection
MERGE (ra11:RecallAction {id: 'RA_B002_011'}) ON CREATE SET
  ra11.action_type = 'FACILITY_INSPECTION',
  ra11.batch_id = 'B002',
  ra11.supplier_id = 'S001',
  ra11.inspection_result = 'CONTAMINATION_CONFIRMED',
  ra11.contamination_source = 'Inadequate refrigeration unit - bacterial growth detected',
  ra11.corrective_action_required = 'Replace refrigeration system, deep clean facility, re-certify FSSAI',
  ra11.performed_by = 'Food Safety Inspector - Dr. Ramesh Gupta',
  ra11.performed_at = '2026-09-28T10:00:00Z',
  ra11.verified_by = 'FSSAI Regional Office',
  ra11.verified_at = '2026-09-28T16:00:00Z',
  ra11.status = 'COMPLETED',
  ra11.notes = 'Supplier suspended until corrective actions completed';

// Action 12: Verification test on new batch
MERGE (ra12:RecallAction {id: 'RA_B002_012'}) ON CREATE SET
  ra12.action_type = 'VERIFICATION_TEST',
  ra12.batch_id = 'B007',
  ra12.supplier_id = 'S001',
  ra12.test_type = 'Microbiological Analysis - E.coli screening',
  ra12.test_lab = 'National Food Testing Laboratory',
  ra12.test_result = 'PASS',
  ra12.test_report_id = 'NFTL-2026-10-05-456',
  ra12.performed_by = 'Lab Technician - Dr. Sanjay Iyer',
  ra12.performed_at = '2026-10-05T14:00:00Z',
  ra12.verified_by = 'Quality Manager - Ravi Kumar',
  ra12.verified_at = '2026-10-05T16:00:00Z',
  ra12.status = 'COMPLETED',
  ra12.notes = 'New batch from S001 verified safe after facility remediation';

// ------------------------------------------------------------
// Relationships: Link actions to entities
// ------------------------------------------------------------

// Link to Batch
MATCH (ra:RecallAction), (b:Batch {id: 'B002'})
WHERE ra.batch_id = 'B002'
MERGE (ra)-[:ACTION_FOR_RECALL]->(b);

// Link disposal actions to Inventory
MATCH (ra:RecallAction {action_type: 'INVENTORY_DISPOSAL'}), (inv:Inventory)
WHERE ra.inventory_id = inv.id
MERGE (ra)-[:DISPOSED]->(inv);

// Link disposal actions to Kitchen
MATCH (ra:RecallAction {action_type: 'INVENTORY_DISPOSAL'}), (k:Kitchen)
WHERE ra.kitchen_id = k.id
MERGE (ra)-[:PERFORMED_AT_KITCHEN]->(k);

// Link customer notifications to Customer
MATCH (ra:RecallAction {action_type: 'CUSTOMER_NOTIFICATION'}), (c:Customer)
WHERE ra.customer_id = c.id
MERGE (ra)-[:NOTIFIED]->(c);

// Link supplier actions to Supplier
MATCH (ra:RecallAction), (s:Supplier {id: 'S001'})
WHERE ra.supplier_id = 'S001'
MERGE (ra)-[:INVOLVED_SUPPLIER]->(s);

// ------------------------------------------------------------
// Verification Queries
// ------------------------------------------------------------

// Check recall completion status
MATCH (b:Batch {id: 'B002', status: 'RECALLED'})
OPTIONAL MATCH (ra:RecallAction)-[:ACTION_FOR_RECALL]->(b)
WITH b, 
     count(DISTINCT CASE WHEN ra.action_type = 'INVENTORY_DISPOSAL' AND ra.status = 'COMPLETED' THEN ra END) AS disposals_completed,
     count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' AND ra.status = 'COMPLETED' THEN ra END) AS notifications_completed,
     count(DISTINCT CASE WHEN ra.action_type = 'CUSTOMER_NOTIFICATION' THEN ra END) AS notifications_total,
     count(DISTINCT CASE WHEN ra.action_type = 'FACILITY_INSPECTION' AND ra.status = 'COMPLETED' THEN ra END) AS inspections_completed
RETURN b.id AS batch_id,
       b.status AS batch_status,
       b.recalled_at AS recall_date,
       disposals_completed AS inventory_disposed,
       notifications_completed + '/' + notifications_total AS customer_notifications,
       inspections_completed AS facility_inspections,
       CASE 
         WHEN disposals_completed >= 2 
          AND notifications_completed >= 6 
          AND inspections_completed >= 1 
         THEN 'RECALL_VERIFIED_COMPLETE'
         ELSE 'RECALL_IN_PROGRESS'
       END AS recall_verification_status;

// Get full action timeline for batch
MATCH (b:Batch {id: 'B002'})<-[:ACTION_FOR_RECALL]-(ra:RecallAction)
RETURN ra.action_type AS action,
       ra.performed_at AS timestamp,
       ra.performed_by AS performed_by,
       ra.status AS status,
       ra.notes AS notes
ORDER BY ra.performed_at;

// Find incomplete actions
MATCH (ra:RecallAction)-[:ACTION_FOR_RECALL]->(b:Batch {id: 'B002'})
WHERE ra.status IN ['PENDING', 'PENDING_ACKNOWLEDGMENT', 'IN_PROGRESS']
RETURN ra.id AS action_id,
       ra.action_type AS action_type,
       ra.status AS status,
       ra.performed_at AS initiated_at,
       ra.notes AS notes
ORDER BY ra.performed_at;

// Calculate recall effectiveness metrics
MATCH (b:Batch {id: 'B002', status: 'RECALLED'})
OPTIONAL MATCH (inv:Inventory)-[:SOURCED_FROM]->(b)
OPTIONAL MATCH (ra_disposal:RecallAction {action_type: 'INVENTORY_DISPOSAL'})-[:DISPOSED]->(inv)
WITH b, 
     sum(inv.remaining_quantity) AS total_contaminated_kg,
     sum(CASE WHEN ra_disposal.status = 'COMPLETED' THEN ra_disposal.quantity_disposed ELSE 0 END) AS total_disposed_kg
RETURN b.id AS batch_id,
       total_contaminated_kg AS contaminated_stock_kg,
       total_disposed_kg AS disposed_stock_kg,
       CASE 
         WHEN total_disposed_kg >= total_contaminated_kg THEN 'FULL_DISPOSAL_VERIFIED'
         ELSE 'PARTIAL_DISPOSAL_ONLY'
       END AS disposal_verification_status,
       round(100.0 * total_disposed_kg / total_contaminated_kg, 2) AS disposal_percentage;
