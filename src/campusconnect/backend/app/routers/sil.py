from fastapi import APIRouter, Depends, HTTPException
from ..core.auth import get_current_user
from ..core.supabase import supabase_admin
from ..core.config import get_settings

router = APIRouter(prefix="/api/sil", tags=["sil"])
settings = get_settings()
REQUIRED = settings.sil_events_required  # 25


@router.get("/progress")
async def sil_progress(user: dict = Depends(get_current_user)):
    """
    Get SIL progress for the current user in the active semester.
    Only counts attendance_verified = True records.
    """
    user_id = user["id"]

    # Active semester
    sem_resp = supabase_admin.table("sil_semesters").select("*").eq("is_active", True).execute()
    if not sem_resp.data:
        return {
            "attended": 0,
            "required": REQUIRED,
            "remaining": REQUIRED,
            "percentage": 0,
            "semester": None,
            "completed": False,
        }

    semester = sem_resp.data[0]
    semester_id = semester["id"]

    # SIL participation record
    sil_resp = supabase_admin.table("sil_participation").select("events_attended").eq("user_id", user_id).eq("semester_id", semester_id).execute()
    attended = sil_resp.data[0]["events_attended"] if sil_resp.data else 0

    # Cross-verify with attendance table (source of truth)
    att_resp = supabase_admin.table("event_attendance").select("id", count="exact").eq("user_id", user_id).eq("attendance_verified", True).eq("sil_credit", True).execute()
    verified_count = att_resp.count or 0

    # Use max of both for safety
    attended = max(attended, verified_count)
    remaining = max(0, REQUIRED - attended)
    percentage = min(100, round((attended / REQUIRED) * 100, 1))

    return {
        "attended": attended,
        "required": REQUIRED,
        "remaining": remaining,
        "percentage": percentage,
        "semester": {
            "id": semester["id"],
            "name": semester.get("name", "Current Semester"),
            "start_date": semester.get("start_date"),
            "end_date": semester.get("end_date"),
        },
        "completed": attended >= REQUIRED,
    }


@router.get("/history")
async def sil_history(user: dict = Depends(get_current_user)):
    """Get attended events that contributed to SIL count."""
    resp = supabase_admin.table("event_attendance").select(
        "*, events(id, title, category, date, mode, city, organizer)"
    ).eq("user_id", user["id"]).eq("attendance_verified", True).eq("sil_credit", True).order("entry_time", desc=True).execute()

    return {
        "history": resp.data or [],
        "total_credited": len(resp.data or []),
    }


@router.get("/leaderboard")
async def sil_leaderboard(college_id: str = "KLU"):
    """Top SIL performers for a college (anonymized for privacy)."""
    sem_resp = supabase_admin.table("sil_semesters").select("id").eq("is_active", True).execute()
    if not sem_resp.data:
        return {"leaderboard": []}

    semester_id = sem_resp.data[0]["id"]

    resp = supabase_admin.table("sil_participation").select(
        "events_attended, users_profile(name, college_id)"
    ).eq("semester_id", semester_id).order("events_attended", desc=True).limit(10).execute()

    leaderboard = []
    for i, row in enumerate(resp.data or []):
        profile = row.get("users_profile") or {}
        if profile.get("college_id") == college_id:
            leaderboard.append({
                "rank": i + 1,
                "name": profile.get("name", "Anonymous"),
                "events_attended": row.get("events_attended", 0),
            })

    return {"leaderboard": leaderboard, "required": REQUIRED}
