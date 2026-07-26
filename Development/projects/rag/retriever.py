"""
Semantic retrieval from ChromaDB using Ollama embeddings.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import config

import chromadb
import ollama


def search(
    query: str,
    k: int = config.TOP_K,
    category: str | None = None,
) -> list[dict]:
    """
    Return top-k chunks most similar to query.
    Each result: {content, source, doc_title, section, category, score}
    """
    client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))
    try:
        collection = client.get_collection(config.COLLECTION_NAME)
    except Exception:
        return []

    # Embed query
    resp = ollama.embed(model=config.EMBED_MODEL, input=[query])
    query_vec = resp.embeddings[0]

    # Build optional where filter
    where = {"category": category} if category else None

    results = collection.query(
        query_embeddings=[query_vec],
        n_results=k,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        hits.append({
            "content": doc,
            "score": round(1 - dist, 4),   # cosine similarity
            **(meta or {}),
        })

    return hits


def collection_stats() -> dict:
    """Return basic stats about the indexed collection."""
    client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))
    try:
        col = client.get_collection(config.COLLECTION_NAME)
        count = col.count()
        # Sample metadata for category breakdown
        sample = col.get(limit=min(count, 500), include=["metadatas"])
        cats: dict[str, int] = {}
        for m in sample["metadatas"]:
            c = m.get("category", "기타")
            cats[c] = cats.get(c, 0) + 1
        return {"total": count, "categories": cats}
    except Exception:
        return {"total": 0, "categories": {}}
