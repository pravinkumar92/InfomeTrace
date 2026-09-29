# InfoMeTrace - Product Specification

## Product Name
InfoMeTrace

## One-Line Product Pitch
"InfoMeTrace is a graph-powered food safety command center that lets operators investigate supply-chain contamination, simulate recall impact, and execute targeted recalls across suppliers, batches, kitchens, dishes, orders, and customers."

## Target User
**Primary user:** Food Safety / Operations Manager
The product is designed as an operational command center, not as a consumer application.

## Hackathon Problem
**Logistics & Supply Chain Transparency.**
Cloud kitchens across Gurugram, Noida, and Delhi depend on ingredient suppliers and batches. If a paneer batch from a supplier is spoiled, an operator needs to determine every kitchen that received it, every dish that used it, and the downstream orders/customers potentially affected.

The required graph concept is:
`(Farm/Supplier)-[:SUPPLIES]->(Batch)-[:DELIVERED_TO]->(Kitchen)-[:USED_IN]->(Dish)`

InfoMeTrace extends this downstream to:
`(Dish)<-[:ORDERED_AS]-(Order)-[:PLACED_BY]->(Customer)`

The application must allow an operator to flag a Supplier or Batch as contaminated and use Cypher to trace the downstream impact.

## Core Product Purpose
InfoMeTrace must answer:
*"If this supplier or batch is contaminated, exactly what downstream operational impact exists?"*

The system should make that investigation:
- graph-native
- dynamic
- explainable
- operationally useful
- visually understandable
- demonstrably powered by Neo4j and Cypher

The application must NOT merely display hardcoded contamination results. The graph database must be the source of truth for relationship traversal.

## Core Differentiator
**WHAT-IF RECALL SIMULATION**
The operator must be able to simulate the impact of quarantining/recalling a supplier or batch BEFORE applying the change to the live graph state.

The conceptual workflow is:
SIMULATE → DECIDE → APPLY → VERIFY

- Simulation must not mutate live operational state.
- Applying the recall/contamination response must mutate the relevant graph state.
- After applying the change, the operator can run the investigation again and verify the resulting state.

## End-to-End Workflow
The overall product workflow is:
**INVESTIGATE → TRAVERSE → ANALYZE → SIMULATE → DECIDE → RECALL → VERIFY**

### 1. DASHBOARD / COMMAND CENTER
- Operator opens InfoMeTrace.
- System displays high-level supply-chain health information.
- Operator can begin an investigation.

### 2. SELECT ENTITY
- Operator selects either:
  a. Supplier
  b. Batch
- Operator selects an actual entity ID from the available graph data.

### 3. RUN INVESTIGATION
- Operator initiates impact analysis.
- Frontend calls the backend.
- Backend executes parameterized Cypher against Neo4j.
- Neo4j traverses the connected supply-chain graph.

### 4. TRAVERSE DOWNSTREAM IMPACT
The investigation must be able to traverse:
Supplier → Batch → Kitchen → Dish → Order → Customer

### 5. ANALYZE IMPACT
The system calculates graph-derived operational impact including:
- affected batches
- affected kitchens
- affected dishes
- affected orders
- affected customers

### 6. VISUALIZE
- The impact should be shown as a graph/path visualization.
- The affected downstream path should be visually understandable.

### 7. WHAT-IF RECALL SIMULATION
- The operator can simulate quarantine/recall of the selected Supplier or Batch.
- The simulation calculates projected impact.
- It must NOT mutate live state.

### 8. DECISION
- The operator reviews projected impact.

### 9. APPLY RECALL / CONTAMINATION RESPONSE
- If the operator chooses to proceed, the application updates the relevant graph entity status.

### 10. VERIFY
- The operator can rerun the investigation and see the resulting state.

## Core Graph Model
The canonical graph is:
```text
Supplier -[:SUPPLIES]-> Batch
Batch -[:DELIVERED_TO]-> Kitchen
Kitchen -[:USED_IN]-> Dish
Dish <-[:ORDERED_AS]- Order
Order -[:PLACED_BY]-> Customer
```
These relationship names are FROZEN. Do not rename them.

Canonical labels:
- Supplier
- Batch
- Kitchen
- Dish
- Order
- Customer
Do not introduce alternate labels for the same entities.

## Entity Properties
- **Supplier**: id, name, location, certification, status
- **Batch**: id, ingredient, quantity, received_date, expiry_date, status
- **Kitchen**: id, name, city, location, status
- **Dish**: id, name, category, price, status
- **Order**: id, timestamp, status
- **Customer**: id, name, city

## Status Concept
Relevant entities must be able to represent normal and affected/quarantined/contaminated states.
Use clear, consistent status values. Do not create a complex state machine.

## Dynamic Data Requirement
The frontend must NOT contain hardcoded impact numbers. The backend must query Neo4j, and the frontend must consume backend results. Synthetic data is acceptable and expected for the hackathon but must be clearly treated as demo data.

## Data Scale
Intended demo dataset size:
- 8–10 suppliers
- 30–50 batches
- 15–20 kitchens
- 50–80 dishes
- 100–300 orders
- 100–200 customers

The dataset should contain deliberate connected scenarios (e.g., one contaminated batch affecting multiple kitchens, a supplier affecting multiple batches).

## Primary MVP Features
1. Command-center dashboard
2. Supplier/Batch investigation selector
3. Real backend API
4. Real Neo4j database connection
5. Real Cypher queries
6. Dynamic downstream traversal
7. Impact counts
8. Impact graph visualization
9. What-if recall simulation
10. Apply recall / contamination response
11. Verification by rerunning investigation
12. Visible "View Cypher" capability

## Explainable Investigation
InfoMeTrace should make the graph investigation understandable. A "View Cypher" panel/button should show the actual parameterized Cypher query used. Do NOT construct Cypher by unsafe string concatenation. 

## Illustrative Core Cypher Patterns
**Find a batch:**
```cypher
MATCH (b:Batch {id: $batch_id})
RETURN b
```

**Trace downstream impact:**
```cypher
MATCH (b:Batch {id: $batch_id})
      -[:DELIVERED_TO]->(k:Kitchen)
      -[:USED_IN]->(d:Dish)
      <-[:ORDERED_AS]-(o:Order)
      -[:PLACED_BY]->(c:Customer)
RETURN b, k, d, o, c
```

**Contamination update:**
```cypher
MATCH (b:Batch {id: $batch_id})
SET b.status = "CONTAMINATED"
RETURN b
```

## Frontend Direction
**Technology:** React + Vite
Single primary command-center workspace.
Conceptual layout:
- **HEADER:** InfoMeTrace branding, Food Supply Chain Intelligence, system/demo health indicator
- **SIDEBAR:** Overview, Suppliers, Batches, Kitchens, Dishes, Alerts
- **MAIN WORKSPACE:**
  1. Supply-chain health summary
  2. Investigation controls (entity type, entity ID, Run Investigation)
  3. Impact Graph (Supplier, Batch, Kitchen, Dish, Order, Customer)
  4. Impact Summary (kitchens, dishes, orders, customers, affected locations/menu coverage)
  5. Recall Simulator (selected entity, projected impact, simulation result, Apply Recall action)
  6. Technical transparency (View Cypher)

## Backend Direction
**Technology:** Python + FastAPI
The backend is the controlled interface between React and Neo4j.
Architecture: React/Vite → REST API → FastAPI → Neo4j Python Driver → Neo4j → Cypher
Backend responsibilities: API validation, request handling, Neo4j connection management, Cypher execution, result transformation, simulation logic, state application.

## Neo4j Responsibility
Neo4j must be responsible for storing entities/relationships, traversing the graph, querying downstream impact, and supporting recall state changes. 

## Graph Visualization
Options: React Flow, Cytoscape.js.
Graph relationships must come from backend/Neo4j data. Nodes and edges must represent actual Neo4j components.

## Recall Simulation Semantics
Simulation is READ-ONLY. No graph status should be changed by simulation. Only the explicit Apply Recall action may mutate state.

## Safety of State Changes
Separate READ/SIMULATE from WRITE/APPLY RECALL. Do not make simulation accidentally mutate Neo4j.

## API Direction
REST endpoints for: health/status, retrieving available targets, investigating an entity, simulating recall impact, applying state, retrieving Cypher used.

## Error Handling
Gracefully handle: invalid IDs, missing entities, unavailable services, empty impact, malformed requests. No raw stack traces exposed.

## Performance Direction
Use parameterized queries, avoid unnecessary database calls, retrieve only required data.

## Security Direction
No auth required for MVP. Use environment variables for credentials, do not commit .env files.

## Out of Scope for MVP
User authentication, RBAC, payments, real customer data, real supplier APIs, live logistics integrations, GPS, IoT, mobile app, k8s, microservices, cloud deployment, advanced AI/LLM, predictive ML, automated messaging, enterprise SSO, graph editing UI.

## Future Scope
Customer notification simulation, exportable incident reports, AI summaries, predictive scoring, analytics, recall audit trails, geo-impact, real integrations.

## Novelty Principle
GRAPH-POWERED CONTAMINATION INVESTIGATION + WHAT-IF RECALL SIMULATION + OPERATIONAL IMPACT ANALYSIS.

## Demo Narrative
1. Open InfoMeTrace.
2. Show supply-chain graph/data health.
3. Select contaminated batch.
4. Run investigation.
5. Show Neo4j-derived downstream graph.
6. Show affected kitchens, dishes, orders, customers.
7. Open View Cypher.
8. Click What-If Recall.
9. Show projected operational impact (explain read-only nature).
10. Apply recall.
11. Rerun investigation.
12. Verify changed state.
