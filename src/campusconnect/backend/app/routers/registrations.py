from fastapi import APIRouter, Depends, HTTPException
from ..core.auth import get_current_user
from ..core.supabase import supabase_admin
from ..models.schemas import RegisterEventRequest, SaveEventRequest, RateEventRequest

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


@router.post("/")
async def register_for_event(req: RegisterEventRequest, user: dict = Depends(get_current_user)):
    """Register the current user for an event."""
    event_id = req.event_id

    # Check event exists and is active
    event_resp = supabase_admin.table("events").select("id, capacity, college_scope, college_id, title").eq("id", event_id).eq("is_active", True).single().execute()
    if not event_resp.data:
        raise HTTPException(status_code=404, detail="Event not found or no longer active")

    event = event_resp.data

    # College event access check
    if event.get("college_scope"):
        profile_resp = supabase_admin.table("users_profile").select("college_verified, college_id").eq("id", user["id"]).single().execute()
        profile = profile_resp.data or {}
        if not profile.get("college_verified"):
            raise HTTPException(status_code=403, detail="College email verification required")
        if profile.get("college_id") != event.get("college_id"):
            raise HTTPException(status_code=403, detail="This event is for a different college")

    # Check not already registered
    existing = supabase_admin.table("event_registrations").select("id").eq("user_id", user["id"]).eq("event_id", event_id).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    # Check capacity
    if event.get("capacity"):
        reg_count_resp = supabase_admin.table("event_registrations").select("id", count="exact").eq("event_id", event_id).execute()
        reg_count = reg_count_resp.count or 0
        if reg_count >= event["capacity"]:
            raise HTTPException(status_code=409, detail="Event is at full capacity")

    # Create registration
    supabase_admin.table("event_registrations").insert({"user_id": user["id"], "event_id": event_id}).execute()

    # Update interaction record
    _upsert_interaction(user["id"], event_id, {"registered": True})

    return {"message": f"Successfully registered for '{event['title']}'", "event_id": event_id}


@router.delete("/{event_id}")
async def unregister_from_event(event_id: str, user: dict = Depends(get_current_user)):
    """Unregister from an event (if not yet attended)."""
    # Check attendance — can't unregister after attending
    att = supabase_admin.table("event_attendance").select("id, entry_verified").eq("user_id", user["id"]).eq("event_id", event_id).execute()
    if att.data and att.data[0].get("entry_verified"):
        raise HTTPException(status_code=400, detail="Cannot unregister after event check-in")

    supabase_admin.table("event_registrations").delete().eq("user_id", user["id"]).eq("event_id", event_id).execute()
    _upsert_interaction(user["id"], event_id, {"registered": False})
    return {"message": "Unregistered successfully"}


@router.post("/save")
async def save_event(req: SaveEventRequest, user: dict = Depends(get_current_user)):
    """Save/bookmark an event for later."""
    existing = supabase_admin.table("event_saves").select("id").eq("user_id", user["id"]).eq("event_id", req.event_id).execute()
    if existing.data:
        return {"message": "Event already saved"}

    supabase_admin.table("event_saves").insert({"user_id": user["id"], "event_id": req.event_id}).execute()
    _upsert_interaction(user["id"], req.event_id, {"saved": True})
    return {"message": "Event saved"}


@router.delete("/save/{event_id}")
async def unsave_event(event_id: str, user: dict = Depends(get_current_user)):
    """Remove a saved event."""
    supabase_admin.table("event_saves").delete().eq("user_id", user["id"]).eq("event_id", event_id).execute()
    _upsert_interaction(user["id"], event_id, {"saved": False})
    return {"message": "Event unsaved"}


@router.post("/rate")
async def rate_event(req: RateEventRequest, user: dict = Depends(get_current_user)):
    """Rate an attended event (1–5)."""
    att = supabase_admin.table("event_attendance").select("attendance_verified").eq("user_id", user["id"]).eq("event_id", req.event_id).execute()
    if not att.data or not att.data[0].get("attendance_verified"):
        raise HTTPException(status_code=400, detail="You can only rate events you attended")

    supabase_admin.table("event_ratings").upsert({"user_id": user["id"], "event_id": req.event_id, "rating": req.rating}).execute()
    _upsert_interaction(user["id"], req.event_id, {"rating": req.rating})
    return {"message": "Rating submitted"}


@router.get("/my")
async def my_registrations(user: dict = Depends(get_current_user)):
    """Get all events the user is registered for."""
    resp = supabase_admin.table("event_registrations").select("*, events(*)").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return {"registrations": resp.data or []}


@router.get("/my/saved")
async def my_saved_events(user: dict = Depends(get_current_user)):
    """Get all saved events."""
    resp = supabase_admin.table("event_saves").select("*, events(*)").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return {"saved": resp.data or []}


@router.get("/my/history")
async def participation_history(user: dict = Depends(get_current_user)):
    """Get attended events history with SIL status."""
    resp = supabase_admin.table("event_attendance").select("*, events(title, category, date, mode)").eq("user_id", user["id"]).order("entry_time", desc=True).execute()
    return {"history": resp.data or []}


def _upsert_interaction(user_id: str, event_id: str, fields: dict):
    """Upsert event_interactions row."""
    try:
        existing = supabase_admin.table("event_interactions").select("id").eq("user_id", user_id).eq("event_id", event_id).execute()
        if existing.data:
            supabase_admin.table("event_interactions").update(fields).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase_admin.table("event_interactions").insert({"user_id": user_id, "event_id": event_id, **fields}).execute()
    except Exception:
        pass
