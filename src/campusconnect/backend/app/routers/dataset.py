from fastapi import APIRouter
from ..core.supabase import supabase_admin

router = APIRouter(prefix="/api/dataset", tags=["dataset"])


@router.get("/stats")
async def dataset_stats():
    """Summary statistics for the dataset demo page."""
    events_resp = supabase_admin.table("events").select("id", count="exact").execute()
    users_resp = supabase_admin.table("users_profile").select("id", count="exact").execute()
    interactions_resp = supabase_admin.table("event_interactions").select("id", count="exact").execute()
    attendance_resp = supabase_admin.table("event_attendance").select("id", count="exact").execute()
    verified_resp = supabase_admin.table("event_attendance").select("id", count="exact").eq("attendance_verified", True).execute()
    college_events_resp = supabase_admin.table("events").select("id", count="exact").eq("college_scope", True).execute()
    general_events_resp = supabase_admin.table("events").select("id", count="exact").eq("college_scope", False).execute()

    return {
        "total_events": events_resp.count or 0,
        "total_users": users_resp.count or 0,
        "total_interactions": interactions_resp.count or 0,
        "total_attendance": attendance_resp.count or 0,
        "verified_attendance": verified_resp.count or 0,
        "college_events": college_events_resp.count or 0,
        "general_events": general_events_resp.count or 0,
        "dataset_type": "synthetic",
        "note": "This is a synthetic dataset generated for prototype development. "
                "Real interaction data will be collected after deployment.",
    }


@router.get("/categories")
async def events_by_category():
    """Event count per category for chart."""
    resp = supabase_admin.table("events").select("category").execute()
    from collections import Counter
    counts = Counter(e["category"] for e in (resp.data or []) if e.get("category"))
    return {
        "categories": [
            {"category": cat, "count": count}
            for cat, count in sorted(counts.items(), key=lambda x: -x[1])
        ]
    }


@router.get("/interactions")
async def interaction_breakdown():
    """Breakdown of interaction types for chart."""
    resp = supabase_admin.table("event_interactions").select("viewed, saved, registered, attended, rating").execute()
    rows = resp.data or []

    viewed = sum(1 for r in rows if r.get("viewed"))
    saved = sum(1 for r in rows if r.get("saved"))
    registered = sum(1 for r in rows if r.get("registered"))
    attended = sum(1 for r in rows if r.get("attended"))
    rated = sum(1 for r in rows if r.get("rating"))

    return {
        "interactions": [
            {"type": "Viewed",     "count": viewed,     "weight": 1},
            {"type": "Saved",      "count": saved,      "weight": 3},
            {"type": "Registered", "count": registered, "weight": 5},
            {"type": "Attended",   "count": attended,   "weight": 8},
            {"type": "Rated",      "count": rated,      "weight": 10},
        ]
    }


@router.get("/user-interests")
async def user_interest_distribution():
    """Interest distribution across all users for chart."""
    resp = supabase_admin.table("user_preferences").select("interests").execute()
    from collections import Counter
    all_interests = []
    for row in (resp.data or []):
        interests = row.get("interests") or []
        all_interests.extend(interests)
    counts = Counter(all_interests)
    return {
        "interests": [
            {"interest": k, "count": v}
            for k, v in sorted(counts.items(), key=lambda x: -x[1])[:15]
        ]
    }


@router.get("/mode-distribution")
async def mode_distribution():
    """Event mode distribution (online/offline/hybrid)."""
    resp = supabase_admin.table("events").select("mode").execute()
    from collections import Counter
    counts = Counter(e["mode"] for e in (resp.data or []) if e.get("mode"))
    return {
        "modes": [{"mode": k, "count": v} for k, v in counts.items()]
    }
