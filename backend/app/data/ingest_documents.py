"""
Ingest PDF documents into ChromaDB vector store with rich metadata.

Uses ChromaDB's built-in default embedding function (which uses
a local sentence-transformer model) — no OpenAI embedding API needed.

Usage:
    python -m app.data.ingest_documents
"""

import sys
from pathlib import Path

# Allow running as module or standalone
try:
    from app.config import (
        RAW_DATA_DIR,
        VECTORSTORE_DIR,
        CHROMA_COLLECTION_NAME,
        STORAGE_DIR,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
    from app.config import (
        RAW_DATA_DIR,
        VECTORSTORE_DIR,
        CHROMA_COLLECTION_NAME,
        STORAGE_DIR,
    )

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import chromadb
from chromadb.utils import embedding_functions
import shutil


# --- Metadata mapping for each PDF ---
PDF_METADATA = {
    "01_Support_Policy_v3_CURRENT.pdf": {
        "source_type": "policy",
        "status": "current",
        "account_scope": None,
        "effective_date": "2026-06-01",
        "description": "Current support policy v3 with SLA targets by plan and severity",
    },
    "02_Support_Policy_v2_DEPRECATED.pdf": {
        "source_type": "policy",
        "status": "deprecated",
        "account_scope": None,
        "effective_date": "2025-01-15",
        "description": "DEPRECATED support policy v2 - historical reference only, NOT current truth",
    },
    "03_Cancellation_and_Service_Credit_SOP_v4.pdf": {
        "source_type": "SOP",
        "status": "current",
        "account_scope": None,
        "effective_date": "2026-05-01",
        "description": "Cancellation fee rules by order status and default service credit rules",
    },
    "04_Product_Operations_Guide_and_Known_Issues.pdf": {
        "source_type": "product_doc",
        "status": "current",
        "account_scope": None,
        "effective_date": "2026-08-10",
        "description": "Plan capabilities, Bulk Upload limits, and known issues (KI-208, KI-211)",
    },
    "05_Northstar_Logistics_Enterprise_Agreement.pdf": {
        "source_type": "contract",
        "status": "current",
        "account_scope": "ACCT-001",
        "effective_date": "2026-03-01",
        "description": "Northstar Logistics enterprise contract - overrides default policies",
    },
    "06_LumenWorks_Service_Agreement.pdf": {
        "source_type": "contract",
        "status": "current",
        "account_scope": "ACCT-002",
        "effective_date": "2026-04-15",
        "description": "LumenWorks service agreement - overrides default service credit rules",
    },
}


def ingest():
    """Main document ingestion function."""
    print(f"📂 Reading PDFs from: {RAW_DATA_DIR}")

    # Initialize text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    # Process each PDF
    all_chunks = []
    all_metadatas = []
    all_ids = []

    for pdf_filename, meta in PDF_METADATA.items():
        pdf_path = RAW_DATA_DIR / pdf_filename
        if not pdf_path.exists():
            print(f"  ⚠️  Skipping missing file: {pdf_filename}")
            continue

        print(f"  📄 Processing: {pdf_filename}")

        # Load PDF pages
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()
        print(f"     → {len(pages)} pages loaded")

        # Split into chunks
        chunks = text_splitter.split_documents(pages)
        print(f"     → {len(chunks)} chunks created")

        for i, chunk in enumerate(chunks):
            chunk_id = f"{pdf_filename}::chunk_{i:04d}"
            all_ids.append(chunk_id)
            all_chunks.append(chunk.page_content)

            # Build metadata for this chunk
            chunk_meta = {
                "source_file": pdf_filename,
                "source_type": meta["source_type"],
                "status": meta["status"],
                "account_scope": meta["account_scope"] or "all",
                "effective_date": meta["effective_date"],
                "description": meta["description"],
                "page_number": chunk.metadata.get("page", 0),
                "chunk_index": i,
            }
            all_metadatas.append(chunk_meta)

    print(f"\n📊 Total chunks: {len(all_chunks)}")

    # Clear existing vectorstore
    if VECTORSTORE_DIR.exists():
        shutil.rmtree(VECTORSTORE_DIR)
        print("  🗑️  Removed existing vectorstore")

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    # Use ChromaDB's sentence-transformer embedding function (uses local HF model)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    print(f"  🧠 Using local embedding model (all-MiniLM-L6-v2)")

    # Create ChromaDB client and collection
    client = chromadb.PersistentClient(path=str(VECTORSTORE_DIR))

    # Delete collection if it exists (clean start)
    try:
        client.delete_collection(CHROMA_COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=CHROMA_COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )

    # Add documents in batches
    batch_size = 50
    for start in range(0, len(all_chunks), batch_size):
        end = min(start + batch_size, len(all_chunks))
        batch_texts = all_chunks[start:end]
        batch_ids = all_ids[start:end]
        batch_metas = all_metadatas[start:end]

        print(f"  🔄 Embedding + storing batch {start // batch_size + 1} "
              f"({start}-{end-1} of {len(all_chunks)})")

        # ChromaDB embeds automatically with the default function
        collection.add(
            ids=batch_ids,
            documents=batch_texts,
            metadatas=batch_metas,
        )

    print(f"\n✅ Vectorstore created at: {VECTORSTORE_DIR}")
    print(f"   Collection: {CHROMA_COLLECTION_NAME}")
    print(f"   Total documents: {collection.count()}")

    # Quick verification: test a search
    print("\n🔍 Verification — test search: 'cancellation fee'")
    results = collection.query(
        query_texts=["cancellation fee"],
        n_results=3,
        include=["documents", "metadatas", "distances"],
    )

    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    )):
        print(f"\n   Result {i+1} (distance: {dist:.4f}):")
        print(f"   Source: {meta['source_file']} (p.{meta['page_number']})")
        print(f"   Type: {meta['source_type']} | Status: {meta['status']} "
              f"| Scope: {meta['account_scope']}")
        print(f"   Text: {doc[:200]}...")

    # Test metadata filtering
    print("\n🔍 Verification — filtered search (contracts only):")
    results2 = collection.query(
        query_texts=["cancellation fee"],
        n_results=2,
        where={"source_type": "contract"},
        include=["metadatas", "distances"],
    )
    for i, (meta, dist) in enumerate(zip(
        results2["metadatas"][0],
        results2["distances"][0],
    )):
        print(f"   Result {i+1}: {meta['source_file']} "
              f"(scope: {meta['account_scope']}, dist: {dist:.4f})")

    print("\n✅ Document ingestion complete!")


if __name__ == "__main__":
    ingest()
