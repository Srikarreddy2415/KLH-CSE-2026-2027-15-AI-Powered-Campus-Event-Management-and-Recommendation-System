"""
Main recommendation engine — orchestrates cold-start and warm-start paths.

For NEW users (< MIN_HISTORY_EVENTS interactions):
    → cold_start_recommendations() using survey preferences only

For EXISTING users (≥ MIN_HISTORY_EVENTS interactions):
    → Weighted mean of participated event embeddings (history_weight)
    → Blended with survey preference vector (cold_start_weight)
    → Cosine similarity against all upcoming events
    → Location + college boost applied
    → Already-registered events de-ranked
"""

import numpy as np
import logging
from .embeddings import embed_events, embed_interest_tags, get_cached_embedding
from .cold_start import cold_start_recommendations, _cosine_similarity, _build_reason, _get_matching_interests
from .weights import (
    INTERACTION_WEIGHTS,
    MIN_HISTORY_EVENTS,
    COLD_START_BLEND,
    HISTORY_BLEND,
    LOCATION_BOOST,
    COLLEGE_BOOST,
    REGISTERED_PENALTY,
)
from ..core.supabase import supabase_admin

logger = logging.getLogger(__name__)


def get_recommendations(
    user_id: str,
    limit: int = 10,
) -> list[dict]:
    """
    Main entry point for personalized recommendations.
    Automatically chooses cold-start vs warm-start based on interaction count.
    """
    # ── Fetch user profile ────────────────────────────────────────────────────
    profile_resp = supabase_admin.table("users_profile").select("*").eq("id", user_id).single().execute()
    profile = profile_resp.data or {}

    college_id = profile.get("college_id")
    college_verified = profile.get("college_verified", False)
    location = profile.get("location", "")

    # ── Fetch survey preferences ──────────────────────────────────────────────
    pref_resp = supabase_admin.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
    prefs = pref_resp.data or {}
    interests = prefs.get("interests", []) or []
    preferred_mode = prefs.get("preferred_mode", "both")

    # ── Fetch interaction history ─────────────────────────────────────────────
    interactions_resp = (
        supabase_admin.table("event_interactions")
        .select("event_id, viewed, saved, registered, attended, rating")
        .eq("user_id", user_id)
        .execute()
    )
    interactions = interactions_resp.data or []

    # ── Route: cold-start vs warm-start ───────────────────────────────────────
    if len(interactions) < MIN_HISTORY_EVENTS:
        logger.info(f"User {user_id}: cold-start ({len(interactions)} interactions)")
        return cold_start_recommendations(
            interests=interests,
            preferred_mode=preferred_mode,
            preferred_location=location,
            college_id=college_id,
            college_verified=college_verified,
            limit=limit,
        )
    else:
        logger.info(f"User {user_id}: warm-start ({len(interactions)} interactions)")
        return _warm_start_recommendations(
            user_id=user_id,
            interactions=interactions,
            interests=interests,
            preferred_mode=preferred_mode,
            preferred_location=location,
            college_id=college_id,
            college_verified=college_verified,
            limit=limit,
        )


def _warm_start_recommendations(
    user_id: str,
    interactions: list[dict],
    interests: list[str],
    preferred_mode: str,
    preferred_location: str,
    college_id: str | None,
    college_verified: bool,
    limit: int,
) -> list[dict]:
    """Warm-start: blend interaction history + survey preferences."""

    # ── 1. Fetch all interacted events to embed them ──────────────────────────
    event_ids = [i["event_id"] for i in interactions]
    events_resp = supabase_admin.table("events").select("*").in_("id", event_ids).execute()
    interacted_events = {e["id"]: e for e in (events_resp.data or [])}

    embed_events(list(interacted_events.values()))

    # ── 2. Compute interaction weights ────────────────────────────────────────
    weighted_vecs = []
    total_weight = 0.0

    for interaction in interactions:
        eid = interaction["event_id"]
        emb = get_cached_embedding(eid)
        if emb is None:
            continue

        weight = 0
        if interaction.get("viewed"):    weight += INTERACTION_WEIGHTS["viewed"]
        if interaction.get("saved"):     weight += INTERACTION_WEIGHTS["saved"]
        if interaction.get("registered"):weight += INTERACTION_WEIGHTS["registered"]
        if interaction.get("attended"):  weight += INTERACTION_WEIGHTS["attended"]
        rating = interaction.get("rating") or 0
        if rating >= 4:                  weight += INTERACTION_WEIGHTS["positive_rating"]

        if weight > 0:
            weighted_vecs.append(emb * weight)
            total_weight += weight

    if not weighted_vecs or total_weight == 0:
        # Fallback to cold-start if no weighted vectors
        return cold_start_recommendations(
            interests, preferred_mode, preferred_location,
            college_id, college_verified, limit
        )

    history_vec = np.sum(weighted_vecs, axis=0) / total_weight
    norm = np.linalg.norm(history_vec)
    if norm > 0:
        history_vec /= norm

    # ── 3. Blend with survey preference vector ────────────────────────────────
    survey_vec = embed_interest_tags(interests)
    user_vec = HISTORY_BLEND * history_vec + COLD_START_BLEND * survey_vec
    norm = np.linalg.norm(user_vec)
    if norm > 0:
        user_vec /= norm

    # ── 4. Fetch candidate events (upcoming, access-controlled) ───────────────
    query = supabase_admin.table("events").select("*").eq("is_active", True)
    if not college_verified:
        query = query.eq("college_scope", False)
    all_events_resp = query.execute()
    all_events = all_events_resp.data or []

    # De-duplicate: skip events already attended
    attended_ids = {i["event_id"] for i in interactions if i.get("attended")}
    registered_ids = {i["event_id"] for i in interactions if i.get("registered")}

    embed_events(all_events)

    # ── 5. Score all candidate events ─────────────────────────────────────────
    scored = []
    for event in all_events:
        emb = get_cached_embedding(event["id"])
        if emb is None:
            continue

        score = _cosine_similarity(user_vec, emb)

        # Boosts
        if preferred_location and event.get("city", "").lower() == preferred_location.lower():
            score += LOCATION_BOOST
        if college_verified and college_id and event.get("college_id") == college_id:
            score += COLLEGE_BOOST

        # Mode soft penalty
        if preferred_mode and preferred_mode != "both":
            if event.get("mode") != preferred_mode and event.get("mode") != "hybrid":
                score *= 0.6

        # De-rank already-registered (not attended) events
        if event["id"] in registered_ids and event["id"] not in attended_ids:
            score *= REGISTERED_PENALTY

        # Explanation
        top_matching = _get_matching_interests(interests, event)
        reason = _build_reason_warm(top_matching, event, interactions)

        scored.append({
            **event,
            "score": round(score, 4),
            "recommendation_reason": reason,
            "recommendation_type": "personalized",
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def _build_reason_warm(matched_interests: list[str], event: dict, interactions: list[dict]) -> str:
    """More detailed reason for warm-start users."""
    if matched_interests:
        return f"Based on your interest in {', '.join(matched_interests)}"
    cat = event.get("category", "")
    if cat:
        return f"Similar to {cat} events you've participated in"
    return "Recommended based on your participation history"
