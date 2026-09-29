# InfoMeTrace API Documentation

**Version:** 1.0  
**Base URL:** `http://127.0.0.1:8000`  
**Production:** `https://your-domain.com`

---

## Table of Contents

1. [Investigation APIs](#investigation-apis)
2. [Reverse Trace APIs](#reverse-trace-apis)
3. [Status Management APIs](#status-management-apis)
4. [Recall Verification APIs](#recall-verification-apis)
5. [Simulation APIs](#simulation-apis)
6. [Advanced Feature APIs](#advanced-feature-apis)
7. [AI Assistant APIs](#ai-assistant-apis)
8. [System APIs](#system-apis)
9. [Error Responses](#error-responses)

---

## Investigation APIs

### POST /api/investigate/batch

Investigate the downstream impact of a contaminated batch.

**Request:**
```http
POST /api/investigate/batch
Content-Type: application/json

{
  "batch_id": "B002"
}
```

**Response:**
```json
{
  "batch_id": "B002",
  "supplier": {
    "id": "S001",
    "name": "FreshFarm Organics"
  },
  "kitchens": 2,
  "dishes": 5,
  "orders": 7,
  "customers": 7,
  "graph": {
    "nodes": [
      {
        "id": "B002",
        "type": "Batch",
        "label": "Batch B002",
        "status": "RECALLED",
        "properties": { ... }
      },
      ...
    ],
    "edges": [
      {
        "id": "e1",
        "source": "B002",
        "target": "K01",
        "type": "DELIVERED_TO"
      },
      ...
    ]
  }
}
```

**Status Codes:**
- `200 OK` — Investigation successful
- `404 Not Found` — Batch not found
- `500 Internal Server Error` — Database connection error

---

## Reverse Trace APIs

### POST /api/trace/origin

Trace an order or customer back to its source supplier and batch.

**Request:**
```http
POST /api/trace/origin
Content-Type: application/json

{
  "entity_type": "Order",
  "entity_id": "O07"
}
```

**Supported Entity Types:**
- `Order`
- `Customer`

**Response:**
```json
{
  "entity_type": "Order",
  "entity_id": "O07",
  "path": ["O07", "D05", "K02", "B002", "S001"],
  "entities": {
    "order": {
      "id": "O07",
      "customer_id": "C07",
      "order_date": "2024-03-10"
    },
    "dish": {
      "id": "D05",
      "name": "Palak Paneer",
      "status": "SUSPENDED"
    },
    "kitchen": {
      "id": "K02",
      "name": "Kitchen North",
      "location": "Noida"
    },
    "batch": {
      "id": "B002",
      "status": "RECALLED",
      "ingredient": "Paneer",
      "recalled_at": "2024-03-15T10:30:00Z"
    },
    "supplier": {
      "id": "S001",
      "name": "FreshFarm Organics",
      "contact": "supplier@freshfarm.com"
    }
  }
}
```

**Status Codes:**
- `200 OK` — Trace successful
- `400 Bad Request` — Invalid entity type
- `404 Not Found` — Entity not found

---

## Status Management APIs

### POST /api/status/update

Update the status of a single entity (Batch, Inventory, or Dish).

**Request:**
```http
POST /api/status/update
Content-Type: application/json

{
  "entity_type": "Batch",
  "entity_id": "B002",
  "new_status": "RECALLED",
  "reason": "E. coli contamination confirmed by lab test #LAB-2024-0315",
  "updated_by": "safety_officer_01"
}
```

**Supported Status Values:**

**For Batch & Inventory:**
- `SAFE` — No contamination detected
- `FLAGGED` — Suspected contamination, under investigation
- `QUARANTINED` — Isolated pending test results
- `RECALLED` — Confirmed contamination, recalled
- `VERIFIED` — Cleared after verification testing

**For Dish:**
- `AVAILABLE` — Safe to serve
- `FLAGGED` — Suspected issue, investigation ongoing
- `SUSPENDED` — Removed from menu
- `VERIFIED` — Cleared and safe to serve again

**Response:**
```json
{
  "success": true,
  "entity_type": "Batch",
  "entity_id": "B002",
  "old_status": "QUARANTINED",
  "new_status": "RECALLED",
  "timestamp": "2024-03-15T10:30:00Z",
  "updated_by": "safety_officer_01"
}
```

**Status Codes:**
- `200 OK` — Status updated successfully
- `400 Bad Request` — Invalid status transition
- `404 Not Found` — Entity not found

---

### POST /api/status/recall-cascade

Execute a full recall cascade: update batch status and propagate to all downstream entities.

**Request:**
```http
POST /api/status/recall-cascade
Content-Type: application/json

{
  "batch_id": "B002",
  "reason": "E. coli contamination confirmed",
  "initiated_by": "safety_officer_01"
}
```

**Response:**
```json
{
  "batch_id": "B002",
  "batch_updated": true,
  "batch_status": "RECALLED",
  "inventory_recalled": 2,
  "inventory_ids": ["INV001", "INV002"],
  "dishes_suspended": 4,
  "dish_ids": ["D03", "D04", "D05", "D07"],
  "customers_to_notify": 7,
  "customer_ids": ["C01", "C03", "C05", "C07", "C08", "C09", "C10"],
  "cascade_complete": true,
  "timestamp": "2024-03-15T10:30:00Z"
}
```

**Status Codes:**
- `200 OK` — Recall cascade completed
- `404 Not Found` — Batch not found
- `500 Internal Server Error` — Cascade failed (partial update)

---

### GET /api/status/audit

Get compliance overview showing all entities with non-SAFE status.

**Request:**
```http
GET /api/status/audit
```

**Response:**
```json
{
  "timestamp": "2024-03-15T15:00:00Z",
  "batches_recalled": 1,
  "batches_quarantined": 0,
  "batches_flagged": 0,
  "inventory_recalled": 2,
  "inventory_quarantined": 0,
  "dishes_suspended": 4,
  "dishes_flagged": 0,
  "customers_to_notify": 7,
  "recall_completion_percentage": 90,
  "active_incidents": 1,
  "details": {
    "recalled_batches": [
      {
        "id": "B002",
        "ingredient": "Paneer",
        "supplier": "S001",
        "recalled_at": "2024-03-15T10:30:00Z",
        "reason": "E. coli contamination confirmed"
      }
    ],
    "recalled_inventory": [
      {
        "id": "INV001",
        "kitchen": "K01",
        "remaining_quantity": "20 kg",
        "status": "RECALLED"
      },
      {
        "id": "INV002",
        "kitchen": "K02",
        "remaining_quantity": "30 kg",
        "status": "RECALLED"
      }
    ],
    "suspended_dishes": [
      {"id": "D03", "name": "Paneer Tikka", "kitchen": "K01"},
      {"id": "D04", "name": "Butter Paneer", "kitchen": "K01"},
      {"id": "D05", "name": "Palak Paneer", "kitchen": "K02"},
      {"id": "D07", "name": "Shahi Paneer", "kitchen": "K02"}
    ]
  }
}
```

**Status Codes:**
- `200 OK` — Audit retrieved successfully

---

## Recall Verification APIs

### POST /api/recall/action

Create a recall action record for audit trail.

**Request:**
```http
POST /api/recall/action
Content-Type: application/json

{
  "batch_id": "B002",
  "action_type": "INVENTORY_DISPOSAL",
  "details": "25kg paneer disposed at Kitchen Central via certified biohazard contractor ABC Corp. Disposal certificate #DISP-2024-0315-001",
  "performed_by": "disposal_team_02",
  "action_date": "2024-03-15T14:30:00Z"
}
```

**Supported Action Types:**
- `INVENTORY_DISPOSAL` — Physical destruction of contaminated stock
- `CUSTOMER_NOTIFICATION` — Customer alert sent (email/SMS/phone)
- `VERIFICATION_TEST` — Lab test confirming safe status
- `SUPPLIER_NOTIFICATION` — Supplier informed of recall
- `FACILITY_INSPECTION` — Regulatory inspection completed

**Response:**
```json
{
  "action_id": "RA001",
  "batch_id": "B002",
  "action_type": "INVENTORY_DISPOSAL",
  "action_date": "2024-03-15T14:30:00Z",
  "details": "25kg paneer disposed at Kitchen Central...",
  "performed_by": "disposal_team_02",
  "verification_status": "COMPLETED",
  "created_at": "2024-03-15T14:32:00Z"
}
```

**Status Codes:**
- `201 Created` — Recall action recorded
- `400 Bad Request` — Invalid action type
- `404 Not Found` — Batch not found

---

### GET /api/recall/verify/{batch_id}

Get recall verification status and compliance metrics for a batch.

**Request:**
```http
GET /api/recall/verify/B002
```

**Response:**
```json
{
  "batch_id": "B002",
  "recall_status": "RECALL_VERIFIED_COMPLETE",
  "verification_percentage": 90,
  "actions_completed": {
    "inventory_disposed": "2/2 (50kg total)",
    "customers_notified": "6/7 acknowledged",
    "facility_inspections": "1 completed",
    "supplier_notifications": "1 sent",
    "verification_tests": "0"
  },
  "audit_trail": [
    {
      "action_id": "RA001",
      "action_type": "INVENTORY_DISPOSAL",
      "action_date": "2024-03-15T14:30:00Z",
      "details": "25kg paneer disposed at Kitchen Central",
      "performed_by": "disposal_team_02",
      "verification_status": "COMPLETED"
    },
    {
      "action_id": "RA002",
      "action_type": "INVENTORY_DISPOSAL",
      "action_date": "2024-03-15T15:00:00Z",
      "details": "25kg paneer disposed at Kitchen North",
      "performed_by": "disposal_team_03",
      "verification_status": "COMPLETED"
    },
    ...
  ],
  "recommended_actions": [
    "Complete customer notification for C10",
    "Schedule follow-up facility inspection in 30 days"
  ]
}
```

**Verification Status Values:**
- `RECALL_NOT_STARTED` — <25% actions completed
- `RECALL_IN_PROGRESS` — 25-75% actions completed
- `RECALL_VERIFIED_COMPLETE` — >75% actions completed

**Status Codes:**
- `200 OK` — Verification status retrieved
- `404 Not Found` — Batch not found

---

### POST /api/recall/action/{action_id}/acknowledge

Acknowledge a recall action (typically used for customer notifications).

**Request:**
```http
POST /api/recall/action/RA003/acknowledge
Content-Type: application/json

{
  "acknowledged_by": "customer_C07",
  "acknowledgment_date": "2024-03-15T16:00:00Z",
  "notes": "Customer confirmed receipt of notification via email"
}
```

**Response:**
```json
{
  "action_id": "RA003",
  "previous_status": "PENDING",
  "new_status": "ACKNOWLEDGED",
  "acknowledged_by": "customer_C07",
  "acknowledgment_date": "2024-03-15T16:00:00Z"
}
```

**Status Codes:**
- `200 OK` — Acknowledgment recorded
- `404 Not Found` — Action not found

---

## Simulation APIs

### POST /api/simulate/containment

Simulate the impact of containing a batch at a specific kitchen (read-only operation).

**Request:**
```http
POST /api/simulate/containment
Content-Type: application/json

{
  "batch_id": "B002",
  "kitchen_id": "K01"
}
```

**Response:**
```json
{
  "batch_id": "B002",
  "containment_kitchen": "K01",
  "original_impact": {
    "kitchens": 2,
    "dishes": 5,
    "orders": 7,
    "customers": 7
  },
  "simulated_remaining": {
    "kitchens": 1,
    "dishes": 2,
    "orders": 3,
    "customers": 3
  },
  "reduction": {
    "kitchens_prevented": 1,
    "dishes_prevented": 3,
    "orders_prevented": 4,
    "customers_prevented": 4
  },
  "containment_effectiveness": "57%",
  "note": "This is a read-only simulation. No database changes were made."
}
```

**Status Codes:**
- `200 OK` — Simulation completed
- `404 Not Found` — Batch or kitchen not found

---

## Advanced Feature APIs

### POST /api/explain/order

Explain why a specific order is affected by contamination, showing recipe-level details.

**Request:**
```http
POST /api/explain/order
Content-Type: application/json

{
  "order_id": "O07"
}
```

**Response:**
```json
{
  "order_id": "O07",
  "customer_id": "C07",
  "order_date": "2024-03-10",
  "dish": {
    "id": "D05",
    "name": "Palak Paneer",
    "status": "SUSPENDED"
  },
  "kitchen": {
    "id": "K02",
    "name": "Kitchen North"
  },
  "contamination_path": {
    "contaminated_ingredient": "Paneer",
    "recipe": {
      "name": "Palak Paneer Recipe",
      "quantity_per_serving": "0.12 kg"
    },
    "inventory": {
      "id": "INV002",
      "received_quantity": "100 kg",
      "consumed_quantity": "70 kg",
      "remaining_quantity": "30 kg",
      "status": "RECALLED"
    },
    "batch": {
      "id": "B002",
      "status": "RECALLED",
      "recalled_at": "2024-03-15T10:30:00Z",
      "reason": "E. coli contamination confirmed"
    },
    "supplier": {
      "id": "S001",
      "name": "FreshFarm Organics"
    }
  },
  "explanation": "Order O07 contains Palak Paneer, which requires 0.12kg paneer per serving. Kitchen North prepared this dish using inventory from Batch B002 (FreshFarm Organics), which has been recalled due to E. coli contamination. Kitchen North has 30kg of contaminated paneer remaining from this batch."
}
```

**Status Codes:**
- `200 OK` — Explanation generated
- `404 Not Found` — Order not found
- `500 Internal Server Error` — Unable to trace contamination path (graceful degradation)

---

## AI Assistant APIs

### POST /api/assistant/chat

Send a question to the AI assistant with live Neo4j context.

**Request:**
```http
POST /api/assistant/chat
Content-Type: application/json

{
  "question": "How much contaminated inventory remains?",
  "entity_type": "Batch",
  "entity_id": "B002",
  "context": {
    "investigation_type": "batch",
    "impact": {
      "kitchens": 2,
      "dishes": 5,
      "orders": 7,
      "customers": 7
    }
  }
}
```

**Response:**
```json
{
  "question": "How much contaminated inventory remains?",
  "answer": "Based on current Neo4j graph data:\n\n**Contaminated Inventory Remaining:**\n- Kitchen Central (K01): 20kg paneer from Batch B002\n- Kitchen North (K02): 30kg paneer from Batch B002\n\n**Total:** 50kg contaminated inventory requires disposal\n\n**Status:** Both inventory nodes (INV001, INV002) are marked RECALLED\n\n**Recommendation:** Execute immediate disposal protocol for remaining 50kg at both kitchens. Verify disposal completion with certified contractor receipts.",
  "source": "LIVE_NEO4J_GRAPH",
  "timestamp": "2024-03-15T15:00:00Z",
  "context_used": {
    "batch_status": "RECALLED",
    "inventory_count": 2,
    "total_remaining_kg": 50
  }
}
```

**Status Codes:**
- `200 OK` — AI response generated
- `400 Bad Request` — Missing required fields
- `503 Service Unavailable` — Gemini API unavailable

---

## System APIs

### GET /health

Check system health and service availability.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-15T15:00:00Z",
  "services": {
    "neo4j": {
      "status": "connected",
      "uri": "neo4j+s://82fdc1b6.databases.neo4j.io",
      "database": "82fdc1b6",
      "response_time_ms": 45
    },
    "gemini": {
      "status": "available",
      "model": "gemini-1.5-flash"
    }
  },
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK` — All services healthy
- `503 Service Unavailable` — One or more services down

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Entity not found",
  "detail": "Batch with id 'B999' does not exist in the database",
  "status_code": 404,
  "timestamp": "2024-03-15T15:00:00Z",
  "path": "/api/investigate/batch"
}
```

### Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, missing required fields, invalid status transition |
| 404 | Not Found | Entity (batch/order/customer) not found in database |
| 500 | Internal Server Error | Database connection failure, Cypher query error |
| 503 | Service Unavailable | Neo4j or Gemini API unavailable |

---

## Rate Limiting

**Current Limits:**
- AI Assistant: 60 requests/minute
- All other endpoints: 100 requests/minute

**Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1647356400
```

---

## Authentication (Future Enhancement)

**Note:** Current version does not require authentication. Production deployment should implement:
- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- Audit logging

**Recommended Roles:**
- `viewer` — Read-only access (investigation, trace, simulation)
- `operator` — Status updates, recall execution
- `admin` — Full access including recall action management

---

## WebSocket Support (Future Enhancement)

**Planned:** Real-time updates for Command Center Dashboard

```javascript
const ws = new WebSocket('ws://127.0.0.1:8000/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // { type: 'status_change', entity_id: 'B002', new_status: 'RECALLED' }
};
```

---

## API Changelog

### Version 1.0.0 (Current)
- Initial release
- 15+ endpoints covering investigation, status, recall, simulation, AI assistance
- Comprehensive error handling
- Production-ready for Neo4j competition submission

---

## Support & Contact

**GitHub:** https://github.com/urstrulysiddhu/InfoMeTrace  
**Issues:** https://github.com/urstrulysiddhu/InfoMeTrace/issues

For API support, please open a GitHub issue with:
- Endpoint called
- Request payload
- Response received
- Expected behavior
