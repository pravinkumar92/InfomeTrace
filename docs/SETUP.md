# InfoMeTrace Setup Guide

Complete setup instructions for local development and deployment.

---

## Prerequisites

### Required Software

1. **Node.js** (v18+ recommended)
   - Download: https://nodejs.org/
   - Verify: `node --version` should show v18.0.0 or higher

2. **Python** (v3.11+ recommended)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version` should show 3.11.0 or higher

3. **Git**
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

4. **Neo4j Account** (Free Aura account)
   - Sign up: https://neo4j.com/cloud/aura-free/
   - You'll receive: URI, username, password, database name

5. **Google Gemini API Key** (Free tier available)
   - Get key: https://aistudio.google.com/app/apikey
   - Free quota: 60 requests/minute

### Optional Tools

- **Neo4j Desktop** — For local graph visualization and query testing
- **VS Code** — Recommended editor with extensions for Python/TypeScript
- **Postman/Insomnia** — For API testing

---

## Step 1: Clone Repository

```powershell
# Clone from GitHub
git clone https://github.com/urstrulysiddhu/InfoMeTrace.git

# Navigate to project root
cd InfoMeTrace
```

**Verify structure:**
```
InfoMeTrace/
├── backend/
├── frontend/
├── cypher/
├── docs/
└── README.md
```

---

## Step 2: Neo4j Setup

### Option A: Neo4j Aura (Recommended for Quick Start)

1. **Create Free Aura Instance**
   - Go to: https://console.neo4j.io/
   - Click "New instance" → Select "Free" tier
   - Choose region closest to you
   - Save your credentials (you'll only see them once!)

2. **Note Your Credentials**
   ```
   URI: neo4j+s://xxxxxxxx.databases.neo4j.io
   Username: neo4j (or custom)
   Password: <your-generated-password>
   Database: neo4j (or custom)
   ```

3. **Run Schema Setup**
   - Open Neo4j Browser at your Aura instance URL
   - Click "Open Browser"
   - Copy content from `InfoMeTrace/cypher/schema.cypher`
   - Paste into Neo4j Browser query editor
   - Click "Run" (or press Ctrl+Enter)
   - **Expected:** "Created 9 constraints"

4. **Load Demonstration Data**
   - Copy content from `InfoMeTrace/cypher/seed.cypher`
   - Paste into Neo4j Browser
   - Click "Run"
   - **Expected:** "Created 43 nodes, 45 relationships"

5. **Load Expanded Dataset (Optional but Recommended)**
   - Copy content from `InfoMeTrace/cypher/seed_expanded.cypher`
   - Paste into Neo4j Browser
   - Click "Run"
   - **Expected:** "Created 45 nodes, 29 relationships"
   - **Total:** 88 nodes, 125 relationships

### Option B: Neo4j Desktop (For Local Development)

1. **Download Neo4j Desktop**
   - https://neo4j.com/download/
   - Install and create account

2. **Create New Database**
   - Click "New" → "Create project"
   - Click "Add" → "Local DBMS"
   - Name: "InfoMeTrace"
   - Password: choose a password
   - Version: 5.x (latest stable)
   - Click "Create"

3. **Start Database**
   - Click "Start" button
   - Wait for status: "Active"

4. **Open Neo4j Browser**
   - Click "Open" button
   - Run schema and seed files as described in Option A

5. **Note Your Credentials**
   ```
   URI: bolt://localhost:7687
   Username: neo4j
   Password: <your-chosen-password>
   Database: neo4j
   ```

---

## Step 3: Backend Setup

### 3.1 Install Python Dependencies

```powershell
# Navigate to backend folder
cd InfoMeTrace/backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Expected packages:**
- fastapi
- uvicorn
- neo4j
- google-generativeai
- pydantic
- python-dotenv

### 3.2 Configure Environment Variables

1. **Create `.env` file:**
   ```powershell
   # Copy example file
   copy .env.example .env
   
   # Open in text editor
   notepad .env
   ```

2. **Edit `.env` with your credentials:**
   ```env
   # Neo4j Configuration
   NEO4J_URI=neo4j+s://82fdc1b6.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-neo4j-password-here
   NEO4J_DATABASE=neo4j
   
   # Google Gemini Configuration
   GEMINI_API_KEY=AIzaSyB_your-api-key-here
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Save and close**

**⚠️ Security Note:** Never commit `.env` to Git! It's already in `.gitignore`.

### 3.3 Verify Database Connection

```powershell
# Run database setup script
python setup_db.py
```

**Expected output:**
```
Connecting to Neo4j...
✓ Connection successful
✓ Database ready with constraints
✓ Sample query: Found 88 nodes, 125 relationships
```

**If errors:**
- ❌ `ServiceUnavailable` → Check NEO4J_URI and network connection
- ❌ `AuthError` → Check NEO4J_USERNAME and NEO4J_PASSWORD
- ❌ `DatabaseError` → Check NEO4J_DATABASE name

### 3.4 Start Backend Server

```powershell
# From InfoMeTrace/backend directory
python -m uvicorn app.main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx]
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test backend:**
- Open browser: http://127.0.0.1:8000/health
- **Expected:** `{"status":"healthy","neo4j":"connected","gemini":"available"}`

### 3.5 Keep Backend Running

**Important:** Leave this terminal window open! Backend must run continuously.

---

## Step 4: Frontend Setup

### 4.1 Install Node Dependencies

**Open a NEW terminal window** (don't close the backend terminal):

```powershell
# Navigate to frontend folder
cd InfoMeTrace/frontend

# Install dependencies
npm install
```

**Expected:** Installs ~200+ packages (React, Vite, Tailwind, React Flow, etc.)

**If errors:**
- ❌ `ENOENT: no such file or directory` → Check you're in `/frontend` folder
- ❌ `npm not found` → Install Node.js from https://nodejs.org/

### 4.2 Configure API Base URL (Optional)

By default, frontend connects to `http://127.0.0.1:8000`. To change:

1. Open `frontend/src/api/types.ts`
2. Update `API_BASE_URL` constant:
   ```typescript
   export const API_BASE_URL = 'http://your-backend-url:8000';
   ```

### 4.3 Start Frontend Development Server

```powershell
# From InfoMeTrace/frontend directory
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Test frontend:**
- Open browser: http://localhost:5173
- **Expected:** InfoMeTrace dashboard loads with "INFOMETRACE" in header

### 4.4 Keep Frontend Running

**Important:** Leave this terminal window open too!

---

## Step 5: Verify Full Stack

### 5.1 Manual Verification

1. **Open http://localhost:5173** in browser
2. **Check header:** "INFOMETRACE" logo, "NEO4J ONLINE" status
3. **Switch to "Investigation Console" tab**
4. **Test Batch Investigation:**
   - Entity Type: **Batch**
   - Entity ID: **B002**
   - Click **"Investigate"**
   - **Expected:** Graph visualization with 2 kitchens, 5 dishes, 7 orders, 7 customers

5. **Test Reverse Trace:**
   - Click **"Reverse Trace"** tab
   - Entity Type: **Order**
   - Entity ID: **O07**
   - Click **"Trace Origin"**
   - **Expected:** Path: O07 → D05 → K02 → B002 → S001

6. **Test AI Assistant:**
   - Click **"Trace Assist"** tab
   - Type: **"How much inventory remains?"**
   - Click **Send**
   - **Expected:** AI response with quantity details (may take 3-5 seconds)

### 5.2 Automated Test Suite

```powershell
# Open a THIRD terminal window
cd InfoMeTrace/backend

# Ensure backend is running (check http://127.0.0.1:8000/health)

# Run test suite
python test_suite.py
```

**Expected output:**
```
╔════════════════════════════════════════════╗
║   InfoMeTrace Production Test Suite       ║
║   Comprehensive System Validation         ║
╚════════════════════════════════════════════╝

[1/12] ✓ Health Check
[2/12] ✓ Batch Investigation (B002)
[3/12] ✓ Order Reverse Trace (O07)
[4/12] ✓ Customer Reverse Trace (C07)
[5/12] ✓ Status Audit
[6/12] ✓ Recall Verification (B002)
[7/12] ✓ Containment Simulation (K01)
[8/12] ✓ Order Exposure Explanation (O07)
[9/12] ✓ Quantity Tracking Infrastructure
[10/12] ✓ Multi-Supplier Independence
[11/12] ✓ Batch Isolation (B002 vs B011-B014)
[12/12] ✓ Frontend Accessibility

════════════════════════════════════════════
TEST RESULTS: 12/12 PASSED (100%)
════════════════════════════════════════════
```

**If tests fail:**
- Check backend is running on port 8000
- Check frontend is running on port 5173
- Check Neo4j database has seed data loaded

---

## Step 6: Load Recall Verification Data (Optional)

For full demonstration of closed-loop recall verification:

```powershell
# Open Neo4j Browser at your Aura instance
# Copy content from InfoMeTrace/cypher/recall_verification.cypher
# Paste and run in Neo4j Browser
```

**Expected:** Creates 12 `RecallAction` nodes demonstrating:
- 2 inventory disposals (50kg total)
- 7 customer notifications (6 acknowledged)
- 1 facility inspection
- 1 supplier notification

**Verify:**
- API: http://127.0.0.1:8000/api/recall/verify/B002
- **Expected:** `recall_status: "RECALL_VERIFIED_COMPLETE"`, `verification_percentage: 90`

---

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
**Solution:**
```powershell
pip install -r backend/requirements.txt
```

**Problem:** `neo4j.exceptions.ServiceUnavailable`
**Solution:**
- Check NEO4J_URI in `.env` is correct
- Ensure Neo4j Aura instance is running (check console.neo4j.io)
- Test connection: `ping 82fdc1b6.databases.neo4j.io` (replace with your URI)

**Problem:** `AuthError: Invalid credentials`
**Solution:**
- Verify NEO4J_USERNAME and NEO4J_PASSWORD in `.env`
- Try resetting Neo4j Aura password in console.neo4j.io

**Problem:** `DatabaseError: Database 'neo4j' does not exist`
**Solution:**
- Check NEO4J_DATABASE in `.env` matches your Neo4j database name
- For Aura, it's usually the instance ID (e.g., `82fdc1b6`)

**Problem:** `Gemini API 404 Not Found`
**Solution:**
- Verify GEMINI_API_KEY is correct
- Check GEMINI_MODEL is `gemini-1.5-flash` (not `gemini-2.5-flash`)

### Frontend Issues

**Problem:** `npm ERR! code ENOENT`
**Solution:**
```powershell
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem:** `Network Error` when investigating batches
**Solution:**
- Check backend is running: http://127.0.0.1:8000/health
- Check browser console for CORS errors
- Verify API_BASE_URL in frontend code

**Problem:** `Graph not rendering`
**Solution:**
- Open browser DevTools (F12)
- Check Console for errors
- Verify Neo4j database has seed data (run seed.cypher)

### Port Conflicts

**Problem:** `Address already in use: 8000` (backend)
**Solution:**
```powershell
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or use different port:
uvicorn app.main:app --port 8001
```

**Problem:** `Port 5173 already in use` (frontend)
**Solution:**
```powershell
# Vite will automatically try 5174, 5175, etc.
# Or specify port:
npm run dev -- --port 3000
```

---

## Production Deployment

### Backend Deployment (Railway/Render/Fly.io)

1. **Add `Procfile`:**
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. **Set environment variables** in hosting platform:
   - `NEO4J_URI`
   - `NEO4J_USERNAME`
   - `NEO4J_PASSWORD`
   - `NEO4J_DATABASE`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`

3. **Deploy:**
   ```powershell
   git push railway main
   # or
   git push heroku main
   ```

### Frontend Deployment (Vercel)

1. **Vercel config already included** (`vercel.json`)

2. **Deploy:**
   ```powershell
   npm install -g vercel
   cd frontend
   vercel
   ```

3. **Set environment variable:**
   - `VITE_API_BASE_URL` → Your backend URL

4. **Update API base URL** in `frontend/src/api/types.ts`:
   ```typescript
   export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
   ```

---

## Development Workflow

### Daily Development

**Terminal 1 (Backend):**
```powershell
cd InfoMeTrace/backend
python -m uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```powershell
cd InfoMeTrace/frontend
npm run dev
```

### Making Changes

**Backend changes:**
- Edit files in `backend/app/`
- Backend auto-reloads with `--reload` flag
- No restart needed

**Frontend changes:**
- Edit files in `frontend/src/`
- Vite auto-reloads (hot module replacement)
- See changes instantly in browser

### Database Changes

**To reset database:**
```cypher
// In Neo4j Browser
MATCH (n) DETACH DELETE n;
```

**To reload data:**
- Run `schema.cypher` → `seed.cypher` → `seed_expanded.cypher`

### Running Tests

**Backend API tests:**
```powershell
cd InfoMeTrace/backend
python test_suite.py
```

**Frontend type checking:**
```powershell
cd InfoMeTrace/frontend
npm run type-check
```

**Frontend build test:**
```powershell
npm run build
```

---

## Next Steps

Once setup is complete:

1. ✅ **Read the Demo Script:** `docs/DEMO_SCRIPT.md` — Learn how to present InfoMeTrace
2. ✅ **Explore API:** `docs/API.md` — Full API reference with examples
3. ✅ **Review Architecture:** `docs/architecture.md` — Technical design details
4. ✅ **Check Product Spec:** `docs/product-spec.md` — Feature requirements

---

## Support

**Issues?** Open a GitHub issue with:
- Operating system
- Node/Python versions
- Error message (full stack trace)
- Steps to reproduce

**GitHub:** https://github.com/urstrulysiddhu/InfoMeTrace  
**Issues:** https://github.com/urstrulysiddhu/InfoMeTrace/issues

---

## Quick Reference

**Backend:**
- URL: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health
- Docs: http://127.0.0.1:8000/docs (Swagger UI)

**Frontend:**
- URL: http://localhost:5173
- Build: `npm run build`
- Preview: `npm run preview`

**Neo4j:**
- Aura Console: https://console.neo4j.io/
- Browser: https://workspace-preview.neo4j.io/workspace/query
- Cypher files: `InfoMeTrace/cypher/`

**Testing:**
- Test suite: `python backend/test_suite.py`
- Expected: 12/12 tests passing

**Environment:**
- Backend config: `backend/.env`
- Never commit `.env` to Git!
