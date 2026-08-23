"""
ParcelPilot AI Agent — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import SQLITE_DB_PATH, VECTORSTORE_DIR
from app.routers import auth, chat, actions, signals

app = FastAPI(
    title="ParcelPilot AI Support Agent",
    description="Internal AI assistant for ParcelPilot support and operations staff",
    version="1.0.0",
)

# CORS — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(actions.router)
app.include_router(signals.router)


@app.get("/")
async def root():
    return {
        "name": "ParcelPilot AI Support Agent",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check — verifies DB and vectorstore are accessible."""
    issues = []

    if not SQLITE_DB_PATH.exists():
        issues.append("SQLite database not found. Run scripts/setup.sh first.")

    if not VECTORSTORE_DIR.exists():
        issues.append("Vector store not found. Run scripts/setup.sh first.")

    if issues:
        return {"status": "unhealthy", "issues": issues}

    return {"status": "healthy"}
