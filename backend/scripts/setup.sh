#!/usr/bin/env bash
set -e

echo "🚀 ParcelPilot AI Agent Setup"
echo "=============================="

# 1. Structured data ingestion (xlsx -> SQLite)
echo "1️⃣ Ingesting structured data (xlsx -> SQLite)..."
python -m app.data.ingest_structured

# 2. Document ingestion (PDFs -> ChromaDB)
echo "2️⃣ Ingesting documents (PDFs -> ChromaDB)..."
python -m app.data.ingest_documents

echo "✅ Setup complete! SQLite DB and ChromaDB vector store are ready."
