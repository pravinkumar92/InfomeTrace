from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.database import db
from app.routes.investigation import router as investigation_router
from app.routes.assistant import router as assistant_router
from app.routes.status import router as status_router
from app.routes.recall import router as recall_router
from app.routes.analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.connect()
    yield
    # Shutdown
    db.close()

app = FastAPI(title="InfoMeTrace API", lifespan=lifespan)

# Configure CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Allow Vercel deployments
        "https://*.netlify.app",  # Allow Netlify deployments
        "https://*.onrender.com", # Allow Render frontend
        # Add your production domain here when ready
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(investigation_router)
app.include_router(assistant_router)
app.include_router(status_router)
app.include_router(recall_router)
app.include_router(analytics_router)

@app.get("/health")
def health_check():
    if db.driver:
        try:
            db.driver.verify_connectivity()
            return {"status": "healthy", "database": "connected"}
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "unhealthy", "database": "disconnected", "detail": "Connection verification failed"}
            )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected", "detail": "Driver not initialized"}
        )
