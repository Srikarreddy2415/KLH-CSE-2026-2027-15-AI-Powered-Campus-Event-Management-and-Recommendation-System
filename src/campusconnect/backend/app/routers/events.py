from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..core.auth import get_current_user, get_optional_user, require_college_verified, require_organizer
from ..core.supabase import supabase_admin
from ..models.schemas import EventCreate, EventUpdate

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/")
async def list_events(
    category: Optional[str] = None,
    mode: Optional[str] = None,
    city: Optional[str] = None,
    event_type: Optional[str] = None,
    college_scope: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    user: Optional[dict] = Depends(get_optional_user),
):
    """List events with filters. College events require verified user."""
    query = supabase_admin.table("events").select("*").eq("is_active", True)

    # Non-verified users can only see general events
    if college_scope is True:
        if not user:
            raise HTTPException(status_code=401, detail="Login required for college events")
        # Caller should use /api/events/college endpoint for access control
        query = query.eq("college_scope", True)
    elif college_scope is False:
        query = query.eq("college_scope", False)
    elif not user:
        query = query.eq("college_scope", False)

    if category:
        query = query.eq("category", category)
    if mode:
        query = query.eq("mode", mode)
    if city:
        query = query.ilike("city", f"%{city}%")
    if event_type:
        query = query.eq("event_type", event_type)

    resp = query.order("date", desc=False).range(offset, offset + limit - 1).execute()
    events = resp.data or []

    # Client-side search filter (Supabase free tier doesn't support full-text easily)
    if search:
        search_lower = search.lower()
        events = [
            e for e in events
            if search_lower in e.get("title", "").lower()
            or search_lower in e.get("description", "").lower()
            or search_lower in e.get("category", "").lower()
        ]

    return {"events": events, "total": len(events), "offset": offset}


@router.get("/college")
async def list_college_events(
    college_id: Optional[str] = None,
    category: Optional[str] = None,
    user: dict = Depends(require_college_verified),
):
    """College-only events. Requires verified college email."""
    profile_resp = supabase_admin.table("users_profile").select("college_id").eq("id", user["id"]).single().execute()
    user_college_id = profile_resp.data.get("college_id") if profile_resp.data else None

    query = supabase_admin.table("events").select("*").eq("is_active", True).eq("college_scope", True)

    if college_id:
        query = query.eq("college_id", college_id)
    elif user_college_id:
        query = query.eq("college_id", user_college_id)

    if category:
        query = query.eq("category", category)

    resp = query.order("date", desc=False).execute()
    return {"events": resp.data or [], "college_id": user_college_id}


@router.get("/categories")
async def get_categories():
    """Return all distinct event categories."""
    resp = supabase_admin.table("events").select("category").execute()
    cats = list({e["category"] for e in (resp.data or []) if e.get("category")})
    return {"categories": sorted(cats)}


@router.get("/{event_id}")
async def get_event(event_id: str, user: Optional[dict] = Depends(get_optional_user)):
    """Get single event details. College events require login."""
    resp = supabase_admin.table("events").select("*").eq("id", event_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Event not found")

    event = resp.data
    if event.get("college_scope") and not user:
        raise HTTPException(status_code=401, detail="Login required to view college events")

    # Fetch room details if booked
    if event.get("room_id"):
        room_resp = supabase_admin.table("rooms").select("*, blocks(name, short_name)").eq("id", event["room_id"]).single().execute()
        event["room"] = room_resp.data

    # Record view if logged in
    if user:
        _record_view(user["id"], event_id)

    return event


@router.post("/")
async def create_event(req: EventCreate, user: dict = Depends(require_organizer)):
    """Create a new event. Organizer/Admin only."""
    profile_resp = supabase_admin.table("users_profile").select("college_id, college_verified").eq("id", user["id"]).single().execute()
    profile = profile_resp.data or {}

    # College events require verified organizer
    if req.college_scope and not profile.get("college_verified"):
        raise HTTPException(status_code=403, detail="College email verification required to create college events")

    event_data = req.model_dump()
    event_data["organizer_id"] = user["id"]
    event_data["is_active"] = True

    resp = supabase_admin.table("events").insert(event_data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create event")
    return resp.data[0]


@router.put("/{event_id}")
async def update_event(event_id: str, req: EventUpdate, user: dict = Depends(require_organizer)):
    """Update event details."""
    resp = supabase_admin.table("events").update(req.model_dump(exclude_none=True)).eq("id", event_id).eq("organizer_id", user["id"]).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Event not found or access denied")
    return resp.data[0]


@router.delete("/{event_id}")
async def cancel_event(event_id: str, user: dict = Depends(require_organizer)):
    """Cancel (soft-delete) an event."""
    supabase_admin.table("events").update({"is_active": False}).eq("id", event_id).eq("organizer_id", user["id"]).execute()
    return {"message": "Event cancelled"}


def _record_view(user_id: str, event_id: str):
    """Record an event view interaction (non-blocking, best-effort)."""
    try:
        existing = supabase_admin.table("event_interactions").select("id, viewed").eq("user_id", user_id).eq("event_id", event_id).execute()
        if existing.data:
            supabase_admin.table("event_interactions").update({"viewed": True}).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase_admin.table("event_interactions").insert({"user_id": user_id, "event_id": event_id, "viewed": True}).execute()
    except Exception:
        pass  # View recording is best-effort
