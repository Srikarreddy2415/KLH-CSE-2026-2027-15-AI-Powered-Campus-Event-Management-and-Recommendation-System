from fastapi import APIRouter, Depends, HTTPException, Query
from ..core.auth import get_current_user, require_admin
from ..core.supabase import supabase_admin
from ..models.schemas import RoomCreate, RoomAvailabilityRequest, BlockCreate, CollegeCreate

router = APIRouter(prefix="/api", tags=["rooms", "colleges", "admin"])


# ─── Colleges ─────────────────────────────────────────────────────────────────

@router.get("/colleges")
async def list_colleges():
    resp = supabase_admin.table("colleges").select("*").execute()
    return {"colleges": resp.data or []}


@router.get("/colleges/{college_id}")
async def get_college(college_id: str):
    resp = supabase_admin.table("colleges").select("*, blocks(*, rooms(*))").eq("id", college_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="College not found")
    return resp.data


# ─── Blocks ───────────────────────────────────────────────────────────────────

@router.get("/blocks/{college_id}")
async def list_blocks(college_id: str):
    resp = supabase_admin.table("blocks").select("*").eq("college_id", college_id).execute()
    return {"blocks": resp.data or []}


# ─── Rooms ────────────────────────────────────────────────────────────────────

@router.get("/rooms/{block_id}")
async def list_rooms(block_id: str):
    resp = supabase_admin.table("rooms").select("*").eq("block_id", block_id).execute()
    return {"rooms": resp.data or []}


@router.get("/rooms/available")
async def available_rooms(
    date: str,
    start_time: str,
    end_time: str,
    capacity: int,
    college_id: str = "KLU",
):
    """
    Find rooms suitable for an event of given capacity that have no booking conflicts.

    Conflict check: same room on same date with overlapping times.
    """
    # Get all rooms with sufficient capacity for this college
    blocks_resp = supabase_admin.table("blocks").select("id").eq("college_id", college_id).execute()
    block_ids = [b["id"] for b in (blocks_resp.data or [])]

    if not block_ids:
        return {"available_rooms": [], "message": "No blocks found for this college"}

    all_rooms_resp = supabase_admin.table("rooms").select("*, blocks(name, short_name)").in_("block_id", block_ids).gte("capacity", capacity).execute()
    all_rooms = all_rooms_resp.data or []

    if not all_rooms:
        return {
            "available_rooms": [],
            "message": f"No rooms with capacity ≥ {capacity} found",
            "insufficient_capacity": True,
        }

    # Find conflicting room_ids
    conflicts_resp = supabase_admin.table("events").select("room_id").eq("date", date).eq("is_active", True).not_.is_("room_id", "null").execute()
    conflicting_rooms = set()
    for event in (conflicts_resp.data or []):
        # TODO: time-based overlap check — for now flag all same-day bookings
        # Full implementation: check start_time/end_time overlap
        if event.get("room_id"):
            conflicting_rooms.add(event["room_id"])

    available = []
    for room in all_rooms:
        is_available = room["id"] not in conflicting_rooms
        block_info = room.get("blocks") or {}
        available.append({
            **room,
            "is_available": is_available,
            "block_name": block_info.get("name", ""),
            "block_short_name": block_info.get("short_name", ""),
            "display_name": f"{block_info.get('short_name', '')} {room.get('room_number', '')}",
            "is_sample_data": room.get("is_sample_data", True),
        })

    available.sort(key=lambda r: (not r["is_available"], r["capacity"]))
    return {"available_rooms": available, "requested_capacity": capacity}


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@router.post("/admin/rooms")
async def create_room(req: RoomCreate, user: dict = Depends(require_admin)):
    resp = supabase_admin.table("rooms").insert(req.model_dump()).execute()
    return resp.data[0]


@router.put("/admin/rooms/{room_id}")
async def update_room(room_id: str, req: RoomCreate, user: dict = Depends(require_admin)):
    resp = supabase_admin.table("rooms").update(req.model_dump(exclude_none=True)).eq("id", room_id).execute()
    return resp.data[0]


@router.post("/admin/blocks")
async def create_block(req: BlockCreate, user: dict = Depends(require_admin)):
    resp = supabase_admin.table("blocks").insert(req.model_dump()).execute()
    return resp.data[0]


@router.post("/admin/colleges")
async def create_college(req: CollegeCreate, user: dict = Depends(require_admin)):
    resp = supabase_admin.table("colleges").insert(req.model_dump()).execute()
    return resp.data[0]


@router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    """Dashboard stats for admin panel."""
    events_resp = supabase_admin.table("events").select("id", count="exact").execute()
    users_resp = supabase_admin.table("users_profile").select("id", count="exact").execute()
    reg_resp = supabase_admin.table("event_registrations").select("id", count="exact").execute()
    att_resp = supabase_admin.table("event_attendance").select("id", count="exact").eq("attendance_verified", True).execute()

    return {
        "total_events": events_resp.count or 0,
        "total_users": users_resp.count or 0,
        "total_registrations": reg_resp.count or 0,
        "verified_attendances": att_resp.count or 0,
    }
