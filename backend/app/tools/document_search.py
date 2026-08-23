"""
Document Search Tool — semantic search over the 6 PDFs stored in ChromaDB.

Supports metadata filtering by source_type, status, and account_scope.
Returns chunks with full source attribution.
"""

from typing import Optional

import chromadb
from chromadb.utils import embedding_functions
from langchain_core.tools import tool

from app.config import (
    VECTORSTORE_DIR,
    CHROMA_COLLECTION_NAME,
)

# Module-level singletons (initialized on first use)
_client: Optional[chromadb.PersistentClient] = None
_collection = None


def _get_collection():
    """Lazy-load the ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(VECTORSTORE_DIR))
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = _client.get_collection(
            name=CHROMA_COLLECTION_NAME,
            embedding_function=ef
        )
    return _collection


def search_documents_impl(
    query: str,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    account_scope: Optional[str] = None,
    n_results: int = 5,
    accessible_accounts: Optional[list[str]] = None,
) -> list[dict]:
    """
    Core implementation of document search (not a LangChain tool).
    Used internally and by the LangChain tool wrapper.

    Args:
        query: Natural language search query
        source_type: Filter by type: policy, SOP, contract, product_doc
        status: Filter by status: current, deprecated (defaults to current)
        account_scope: Filter by specific account ID
        n_results: Number of results to return
        accessible_accounts: List of account IDs the user can access
                            (structural enforcement — contracts outside this
                            list are excluded)
    """
    collection = _get_collection()

    # Build metadata filter
    where_conditions = []

    # Default to current documents unless explicitly asking for deprecated
    if status:
        where_conditions.append({"status": status})

    if source_type:
        where_conditions.append({"source_type": source_type})

    if account_scope:
        where_conditions.append({"account_scope": account_scope})

    # --- Structural access control ---
    if accessible_accounts is not None:
        allowed_scopes = ["all"] + list(accessible_accounts)
        where_conditions.append({"account_scope": {"$in": allowed_scopes}})

    # Combine conditions
    where_filter = None
    if len(where_conditions) == 1:
        where_filter = where_conditions[0]
    elif len(where_conditions) > 1:
        where_filter = {"$and": where_conditions}

    # Search using query_texts (embedding function will automatically embed)
    query_kwargs = {
        "query_texts": [query],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"],
    }
    if where_filter:
        query_kwargs["where"] = where_filter

    try:
        results = collection.query(**query_kwargs)
    except Exception as e:
        return [{"error": f"Search failed: {str(e)}"}]

    # Format results
    formatted = []
    if results.get("documents") and len(results["documents"]) > 0:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            formatted.append({
                "content": doc,
                "source_file": meta["source_file"],
                "source_type": meta["source_type"],
                "status": meta["status"],
                "account_scope": meta["account_scope"],
                "effective_date": meta["effective_date"],
                "page_number": meta["page_number"],
                "relevance_score": round(1 - dist, 4),
            })

    return formatted


@tool
def search_documents(
    query: str,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    account_scope: Optional[str] = None,
) -> str:
    """Search ParcelPilot's document knowledge base for policies, SOPs, contracts, and product documentation.

    Use this tool to find information about:
    - Support policies and SLA targets
    - Cancellation fees and service credit rules
    - Customer-specific contract terms and overrides
    - Product capabilities, limits, and known issues

    Args:
        query: Natural language search query describing what you're looking for
        source_type: Optional filter - one of: 'policy', 'SOP', 'contract', 'product_doc'
        status: Optional filter - 'current' or 'deprecated'. Only use 'deprecated' if explicitly asked about old/historical policies.
        account_scope: Optional filter - specific account ID (e.g., 'ACCT-001') to find their contract terms
    """
    # Note: accessible_accounts will be injected by the agent graph
    # based on the user context. The tool signature seen by the LLM
    # does not expose this parameter.
    results = search_documents_impl(
        query=query,
        source_type=source_type,
        status=status,
        account_scope=account_scope,
    )

    if not results:
        return "No relevant documents found for the given query and filters."

    # Format as readable text for the LLM
    output_parts = []
    for i, r in enumerate(results, 1):
        status_tag = f" [⚠️ DEPRECATED]" if r["status"] == "deprecated" else ""
        scope_tag = f" [Account: {r['account_scope']}]" if r["account_scope"] != "all" else ""
        output_parts.append(
            f"--- Result {i} (relevance: {r['relevance_score']}) ---\n"
            f"Source: {r['source_file']} (page {r['page_number']}){status_tag}{scope_tag}\n"
            f"Type: {r['source_type']} | Effective: {r['effective_date']}\n"
            f"Content:\n{r['content']}\n"
        )

    return "\n".join(output_parts)
