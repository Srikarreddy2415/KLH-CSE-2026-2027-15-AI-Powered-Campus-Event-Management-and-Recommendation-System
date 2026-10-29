from fastapi import APIRouter, Depends, HTTPException
from ..core.auth import get_current_user
from ..core.supabase import supabase_admin
from ..models.schemas import ColdStartRequest
from ..recommendation.engine import get_recommendations
from ..recommendation.cold_start import cold_start_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/")
async def personalized_recommendations(
    limit: int = 10,
    user: dict = Depends(get_current_user),
):
    """
    Get personalized recommendations for the authenticated user.

    Routes automatically between:
    - Cold-start: new users with < 5 interactions (uses survey)
    - Warm-start: experienced users (uses interaction history + survey blend)

    Returns events ranked by AI similarity score with explanation.
    """
    try:
        recs = get_recommendations(user_id=user["id"], limit=limit)
        return {
            "recommendations": recs,
            "count": len(recs),
            "user_id": user["id"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@router.post("/cold-start")
async def cold_start(req: ColdStartRequest, user: dict = Depends(get_current_user)):
    """
    Generate recommendations purely from survey preferences.
    Useful for the preference survey result page.
    """
    try:
        recs = cold_start_recommendations(
            interests=req.interests,
            preferred_mode=req.preferred_mode,
            preferred_location=req.preferred_location,
            college_id=req.college_id,
            college_verified=req.college_verified,
            limit=10,
        )
        return {"recommendations": recs, "count": len(recs), "type": "cold_start"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/{event_id}")
async def explain_recommendation(event_id: str, user: dict = Depends(get_current_user)):
    """Explain why a specific event is recommended to this user."""
    # Get the event
    event_resp = supabase_admin.table("events").select("*").eq("id", event_id).single().execute()
    if not event_resp.data:
        raise HTTPException(status_code=404, detail="Event not found")
    event = event_resp.data

    # Get user preferences
    prefs_resp = supabase_admin.table("user_preferences").select("*").eq("user_id", user["id"]).execute()
    prefs = prefs_resp.data[0] if prefs_resp.data else {}
    interests = prefs.get("interests", [])

    # Match interests to event
    event_text = f"{event.get('title','')} {event.get('description','')} {event.get('category','')} {' '.join(event.get('tags',[]) or [])}".lower()
    matched = [i for i in interests if i.lower() in event_text]

    # Get interaction count
    interaction_resp = supabase_admin.table("event_interactions").select("id").eq("user_id", user["id"]).execute()
    interaction_count = len(interaction_resp.data or [])

    return {
        "event_id": event_id,
        "event_title": event.get("title"),
        "matched_interests": matched,
        "total_interactions": interaction_count,
        "recommendation_basis": "interaction_history" if interaction_count >= 5 else "survey_preferences",
        "explanation": f"Recommended because it matches your interest in {', '.join(matched)}" if matched else "Recommended based on your profile",
    }
