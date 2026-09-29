# InfoMeTrace - Technical Architecture

## 1. Architecture Overview
InfoMeTrace utilizes a modern 3-tier architecture focusing heavily on graph database traversal capabilities for supply-chain analysis.

```text
+----------------+      +----------------+      +----------------+
|                |      |                |      |                |
|  React/Vite    +----->+  FastAPI       +----->+  Neo4j         |
|  (Frontend)    | JSON |  (Backend)     | Bolt |  (Database)    |
|                |<-----+                |<-----+                |
+----------------+      +----------------+      +----------------+
```

## 2. System Context
The system acts as a specialized operational command center for Food Safety and Operations Managers to assess the downstream impact of contaminated food items leveraging dynamic graph data.

## 3. Component Architecture
- **Frontend**: React + Vite application functioning as the user interface, rendering visual data and investigation workspaces.
- **Backend**: Python + FastAPI serving as a high-performance REST API orchestrating Neo4j data interaction and simulation logic.
- **Data Store**: Neo4j executing parameterized Cypher queries to resolve graph topologies directly.

## 4. Frontend Architecture
- Built as a single-page application prioritizing the command-center workspace.
- Components cleanly separated between Dashboard Summary, Investigation Controls, Visual Impact Graph (using React Flow or Cytoscape.js), Impact Summary, and the Cypher Transparency Panel.
- Strictly decoupled from the database; handles display and basic interactive flow (simulate vs. apply).

## 5. Backend Architecture
- The FastAPI application is the sole controller interfacing with the Neo4j database via the official Python Driver.
- Distinct routes ensure read-only actions (simulation, investigation) are fully separated from state-mutating actions (applying contamination responses).
- Responsibilities include parameter validation, query string formatting, and parsing Neo4j records into serialized frontend-friendly JSON.

## 6. Neo4j Architecture
- The absolute source of truth. Handles all graph traversal responsibilities.
- Avoids memory-heavy array iteration in backend servers by letting the graph engine compute relational depths natively.

## 7. Graph Data Model
Labels:
- `Supplier`: id, name, location, certification, status
- `Batch`: id, ingredient, quantity, received_date, expiry_date, status
- `Kitchen`: id, name, city, location, status
- `Dish`: id, name, category, price, status
- `Order`: id, timestamp, status
- `Customer`: id, name, city

## 8. Relationship Model
```text
Supplier
  |
SUPPLIES
  v
Batch
  |
DELIVERED_TO
  v
Kitchen
  |
USED_IN
  v
Dish
  |
ORDERED_AS
  ^
Order
  |
PLACED_BY
  v
Customer
```
*Note: The canonical relationship is `(Dish)<-[:ORDERED_AS]-(Order)`. Orders are placed by Customers, and Orders are for (ordered as) Dishes.*

## 9. Investigation Flow
1. Operator requests an investigation using a selected entity (`Supplier` or `Batch`).
2. Frontend transmits HTTP GET request to the Backend API.
3. FastAPI invokes the Neo4j Python Driver, passing parameterized inputs.
4. Neo4j performs traversal down to `Customer` and aggregates impact.
5. FastAPI formats the results and responds.
6. Frontend updates visual components.

## 10. Recall Simulation Flow
1. Operator triggers "Simulate Recall" for a specific entity.
2. Backend runs READ-ONLY queries to predict downstream contamination impact based on existing graph edges.
3. System responds with a projected operational impact summary.
4. The database is explicitly NOT modified.

## 11. Recall Application Flow
1. Operator chooses "Apply Recall" confirming the simulation.
2. Backend receives the POST action and executes a `SET` Cypher operation on the target entity.
3. Target entity status is updated (e.g., to "CONTAMINATED").
4. Backend confirms state mutation.

## 12. Verification Flow
1. Following a Recall Application, the Operator reruns the primary Investigation Flow.
2. The UI naturally consumes and renders the updated state directly from Neo4j proving the mutation.

## 13. API Responsibilities
- Health checks.
- Fetch available suppliers/batches.
- Retrieve downstream investigation paths and aggregates.
- Read-only simulation projections.
- Execute entity state mutations.
- Expose the actual parameterized Cypher query used for the investigation so the frontend can display it in the View Cypher transparency panel. Do not expose database credentials, connection strings, or sensitive configuration.

## 14. Cypher Responsibilities
- Traversal of all linked supply-chain relationships.
- Returning targeted subsets of nodes and edges for visualization.
- Securing parameter execution. Cypher queries use parameters for entity identifiers and request values.
- The View Cypher capability displays the query structure used by the investigation.
- Credentials and secrets are never returned to the frontend.

## 15. Data Flow
`User Input → React State → REST Call → FastAPI Routing → Neo4j Driver → Cypher Traversal → Parsed Record Result → JSON Response → React Render`

## 16. State Management
- React manages UI context and workflow steps.
- Neo4j completely dictates business status properties (normal/contaminated).

## 17. Error Handling
- Invalid entities return explicit operator-friendly responses.
- Backend handles Neo4j connection timeouts securely.
- Complete omission of system stack traces on the frontend.

## 18. Environment Configuration
- Neo4j URI and Credentials secured in `.env` configurations via environment variables.

## 19. Security Considerations
- Parameterized queries to mitigate Cypher injection.
- Exclusion of any explicit `.env` configurations from version control.

## 20. Testing Strategy
The MVP must validate:

1. Investigation:
   - valid Supplier investigation
   - valid Batch investigation
   - downstream traversal
   - graph-derived impact counts

2. Recall Simulation:
   - simulation returns projected impact
   - simulation does NOT mutate Neo4j state

3. Recall Application:
   - Apply Recall performs the intended state mutation
   - the mutation is reflected by subsequent investigation

4. Verification:
   - rerunning the investigation after Apply Recall reflects the updated graph state

5. Error cases:
   - invalid entity ID
   - missing entity
   - empty downstream impact
   - backend/Neo4j unavailable

6. Graph response:
   - returned nodes correspond to actual Neo4j entities
   - returned edges correspond to actual graph relationships

## 21. Deployment Direction for Hackathon
- Intended for local execution or simplified Docker deployment.

## 22. MVP Boundaries
- Includes graph query routing, recall simulation, basic state mutations, Cypher transparency.
- Excludes authentication, production clustering, multi-tenant databases, real world integrations.

## 23. Future Extension Points
- Distributed deployment using Kubernetes.
- Real-time event streaming for inbound batch logistics.
- AI-driven summarizations for operational reports.
