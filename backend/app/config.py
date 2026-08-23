"""
Central configuration for the ParcelPilot AI Agent backend.
All paths, settings, and environment variables are managed here.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend root
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")

# --- Paths ---
APP_DIR = Path(__file__).resolve().parent
RAW_DATA_DIR = APP_DIR / "raw"
STORAGE_DIR = _backend_dir / "storage"
SQLITE_DB_PATH = STORAGE_DIR / "parcelpilot.db"
VECTORSTORE_DIR = STORAGE_DIR / "vectorstore"

# --- OpenAI ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002"

# --- Dataset snapshot time (from xlsx README sheet) ---
# "2026-08-16 11:00 Asia/Kolkata"
SNAPSHOT_TIMESTAMP = "2026-08-16T11:00:00+05:30"

# --- ChromaDB ---
CHROMA_COLLECTION_NAME = "parcelpilot_docs"

# --- Agent ---
MAX_AGENT_ITERATIONS = 10  # max tool-call loops before forcing a response
