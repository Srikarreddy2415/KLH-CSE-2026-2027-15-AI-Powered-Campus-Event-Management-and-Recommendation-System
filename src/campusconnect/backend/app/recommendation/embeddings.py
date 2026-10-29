"""
Event embedding module.

Converts event records into dense vector representations using a
pretrained sentence transformer model. Embeddings are cached in memory
so the model only runs once per server startup.

Model: all-MiniLM-L6-v2 (90 MB, downloaded once from HuggingFace)
Fallback: TF-IDF cosine similarity (if model unavailable / no internet)
"""

import logging
import numpy as np
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Try to load sentence-transformers ────────────────────────────────────────
try:
    from sentence_transformers import SentenceTransformer
    _MODEL_AVAILABLE = True
    logger.info("sentence-transformers available — using semantic embeddings")
except ImportError:
    _MODEL_AVAILABLE = False
    logger.warning("sentence-transformers not available — falling back to TF-IDF")

# Fallback TF-IDF imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine


# ─── Sentence-transformer model (lazy-loaded singleton) ──────────────────────
_st_model: Optional[object] = None

def _get_st_model():
    global _st_model
    if _st_model is None and _MODEL_AVAILABLE:
        try:
            _st_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")
    return _st_model


# ─── In-memory embedding cache {event_id: np.ndarray} ────────────────────────
_embedding_cache: dict[str, np.ndarray] = {}
_tfidf_vectorizer: Optional[TfidfVectorizer] = None
_tfidf_matrix: Optional[np.ndarray] = None
_tfidf_event_ids: list[str] = []


def _build_event_text(event: dict) -> str:
    """Concatenate event fields into a single string for embedding."""
    parts = [
        event.get("title", ""),
        event.get("description", ""),
        event.get("category", ""),
        " ".join(event.get("tags", [])) if isinstance(event.get("tags"), list) else str(event.get("tags", "")),
        event.get("city", ""),
        event.get("mode", ""),
    ]
    return " ".join(filter(None, parts))


def embed_text(text: str) -> np.ndarray:
    """Embed a single text string. Uses ST model or TF-IDF fallback."""
    model = _get_st_model()
    if model:
        return model.encode(text, normalize_embeddings=True)
    else:
        # TF-IDF fallback: fit on single doc (works best when corpus is cached)
        vec = TfidfVectorizer()
        result = vec.fit_transform([text])
        arr = result.toarray()[0]
        norm = np.linalg.norm(arr)
        return arr / norm if norm > 0 else arr


def embed_events(events: list[dict]) -> dict[str, np.ndarray]:
    """
    Compute and cache embeddings for a list of event dicts.
    Returns {event_id: embedding_vector}
    """
    global _embedding_cache, _tfidf_vectorizer, _tfidf_matrix, _tfidf_event_ids

    new_events = [e for e in events if e["id"] not in _embedding_cache]
    if not new_events:
        return _embedding_cache

    texts = [_build_event_text(e) for e in new_events]
    ids   = [e["id"] for e in new_events]

    model = _get_st_model()
    if model:
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        for eid, emb in zip(ids, embeddings):
            _embedding_cache[eid] = emb
    else:
        # TF-IDF path
        all_texts = [_build_event_text(e) for e in events]
        all_ids   = [e["id"] for e in events]
        _tfidf_vectorizer = TfidfVectorizer(max_features=5000)
        matrix = _tfidf_vectorizer.fit_transform(all_texts).toarray()
        # L2-normalize each row
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1
        matrix = matrix / norms
        _tfidf_matrix = matrix
        _tfidf_event_ids = all_ids
        for eid, emb in zip(all_ids, matrix):
            _embedding_cache[eid] = emb

    logger.info(f"Cached embeddings for {len(new_events)} new events. Total cached: {len(_embedding_cache)}")
    return _embedding_cache


def get_cached_embedding(event_id: str) -> Optional[np.ndarray]:
    """Return cached embedding for an event, or None."""
    return _embedding_cache.get(event_id)


def embed_interest_tags(interests: list[str]) -> np.ndarray:
    """Create a user preference vector from interest tag strings."""
    if not interests:
        return np.zeros(384)  # MiniLM embedding dimension

    tag_text = " ".join(interests)
    model = _get_st_model()
    if model:
        return model.encode(tag_text, normalize_embeddings=True)
    else:
        if _tfidf_vectorizer:
            vec = _tfidf_vectorizer.transform([tag_text]).toarray()[0]
            norm = np.linalg.norm(vec)
            return vec / norm if norm > 0 else vec
        return embed_text(tag_text)


def clear_cache():
    """Clear embedding cache (call after bulk event updates)."""
    global _embedding_cache
    _embedding_cache = {}
    logger.info("Embedding cache cleared")
