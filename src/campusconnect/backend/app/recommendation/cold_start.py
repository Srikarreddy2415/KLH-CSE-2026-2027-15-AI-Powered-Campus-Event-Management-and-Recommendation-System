"""
Cold-start recommendation for new users with no interaction history.

Uses the survey preferences (interests, mode, location) to build a
user preference vector and rank events by semantic similarity.
"""

import numpy as np
from .embeddings import embed_events, embed_interest_tags, get_cached_embedding
from .weights import LOCATION_BOOST, COLLEGE_BOOST
from ..core.supabase import supabase_admin
import logging

logger = logging.getLogger(__name__)


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two L2-normalized vectors."""
    if a is None or b is None:
        return 0.0
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def cold_start_recommendations(
    interests: list[str],
    preferred_mode: str,
    preferred_location: str,
    college_id: str | None,
    college_verified: bool,
    limit: int = 10,
) -> list[dict]:
    """
    Generate recommendations for a new user using only survey preferences.

    Algorithm:
    1. Build user preference vector from interest tag embeddings
    2. Fetch all upcoming events (filtered by access rights)
    3. Compute cosine similarity between user vector and each event
    4. Apply location + college boost
    5. Return top-N ranked events
    """
    # ── 1. User preference vector ─────────────────────────────────────────────
    user_vec = embed_interest_tags(interests)

    # ── 2. Fetch events ───────────────────────────────────────────────────────
    query = supabase_admin.table("events").select("*").eq("is_active", True)
    if not college_verified:
        query = query.eq("college_scope", False)

    resp = query.execute()
    events = resp.data or []

    if not events:
        return []

    # ── 3. Embed events ───────────────────────────────────────────────────────
    embed_events(events)

    # ── 4. Score each event ───────────────────────────────────────────────────
    scored = []
    for event in events:
        emb = get_cached_embedding(event["id"])
        if emb is None:
            continue

        score = _cosine_similarity(user_vec, emb)

        # Location boost
        if preferred_location and event.get("city", "").lower() == preferred_location.lower():
            score += LOCATION_BOOST

        # College boost
        if college_verified and college_id and event.get("college_id") == college_id:
            score += COLLEGE_BOOST

        # Mode filter
        if preferred_mode and preferred_mode != "both":
            event_mode = event.get("mode", "")
            if event_mode != preferred_mode and event_mode != "hybrid":
                score *= 0.6  # soft penalty, don't completely exclude

        # Explanation
        top_matching = _get_matching_interests(interests, event)
        reason = _build_reason(top_matching, event)

        scored.append({
            **event,
            "score": round(score, 4),
            "recommendation_reason": reason,
            "recommendation_type": "cold_start",
        })

    # ── 5. Sort and return top-N ──────────────────────────────────────────────
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def _get_matching_interests(interests: list[str], event: dict) -> list[str]:
    """Find which of the user's interests match this event."""
    event_text = f"{event.get('title','')} {event.get('description','')} {event.get('category','')} {event.get('tags','')}".lower()
    matched = [i for i in interests if i.lower() in event_text]
    return matched[:3]


def _build_reason(matched_interests: list[str], event: dict) -> str:
    """Generate a human-readable explanation for the recommendation."""
    if matched_interests:
        interests_str = ", ".join(matched_interests)
        return f"Matches your interest in {interests_str}"
    return f"Recommended based on your profile preferences"
