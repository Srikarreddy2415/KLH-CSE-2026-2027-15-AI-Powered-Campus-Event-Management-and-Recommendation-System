"""
QR Token generation and attendance scanning.

Two-step QR attendance flow:
  1. Organizer generates Entry QR (JWT, type=entry)
  2. Student scans Entry QR → entry_verified = True
  3. Organizer generates Exit QR (JWT, type=exit)
  4. Student scans Exit QR → attendance_verified = True → SIL +1

Security:
  - Tokens are signed JWTs with event_id, type, exp
  - Duplicate scan prevention via database flags
  - Unregistered users are rejected
  - Expired tokens are rejected
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from jose import jwt, JWTError
from ..core.auth import get_current_user, require_organizer
from ..core.supabase import supabase_admin
from ..core.config import get_settings
from ..models.schemas import QRScanRequest

router = APIRouter(prefix="/api", tags=["attendance", "qr"])
settings = get_settings()

QR_SECRET = settings.jwt_secret
QR_ALGORITHM = settings.jwt_algorithm


# ─── QR Generation (Organizer only) ──────────────────────────────────────────

@router.get("/qr/entry/{event_id}")
async def generate_entry_qr(event_id: str, user: dict = Depends(require_organizer)):
    """Generate a time-limited Entry QR token for an event."""
    event = _get_event_or_404(event_id)
    token = _create_qr_token(event_id, "entry", hours=24)
    return {
        "token": token,
        "event_id": event_id,
        "event_title": event.get("title"),
        "type": "entry",
        "expires_in_hours": 24,
        "qr_data": token,  # Frontend renders this as QR code
    }


@router.get("/qr/exit/{event_id}")
async def generate_exit_qr(event_id: str, user: dict = Depends(require_organizer)):
    """Generate a time-limited Exit QR token for an event."""
    event = _get_event_or_404(event_id)
    token = _create_qr_token(event_id, "exit", hours=8)
    return {
        "token": token,
        "event_id": event_id,
        "event_title": event.get("title"),
        "type": "exit",
        "expires_in_hours": 8,
        "qr_data": token,
    }


# ─── QR Scanning (Student) ────────────────────────────────────────────────────

@router.post("/attendance/scan-entry")
async def scan_entry_qr(req: QRScanRequest, user: dict = Depends(get_current_user)):
    """
    Student scans Entry QR.
    Validates: token signature, expiry, event match, registration, not already scanned.
    """
    payload = _decode_qr_token(req.token)

    if payload.get("type") != "entry":
        raise HTTPException(status_code=400, detail="Invalid QR type — please scan the Entry QR code")

    event_id = payload["event_id"]
    user_id = user["id"]

    # Must be registered
    reg = supabase_admin.table("event_registrations").select("id").eq("user_id", user_id).eq("event_id", event_id).execute()
    if not reg.data:
        raise HTTPException(status_code=403, detail="You are not registered for this event")

    # Check for duplicate entry scan
    existing_att = supabase_admin.table("event_attendance").select("*").eq("user_id", user_id).eq("event_id", event_id).execute()
    if existing_att.data and existing_att.data[0].get("entry_verified"):
        raise HTTPException(status_code=409, detail="Entry already recorded for this event")

    # Record entry
    supabase_admin.table("event_attendance").upsert({
        "user_id": user_id,
        "event_id": event_id,
        "entry_time": datetime.utcnow().isoformat(),
        "entry_verified": True,
        "exit_verified": False,
        "attendance_verified": False,
        "sil_credit": False,
    }).execute()

    event = _get_event_or_404(event_id)
    return {
        "message": "Entry verified successfully! ✓",
        "event_title": event.get("title"),
        "entry_time": datetime.utcnow().isoformat(),
        "next_step": "Scan the Exit QR at the end of the event to confirm attendance",
    }


@router.post("/attendance/scan-exit")
async def scan_exit_qr(req: QRScanRequest, user: dict = Depends(get_current_user)):
    """
    Student scans Exit QR.
    Requires prior entry scan. On success: attendance_verified = True, SIL +1.
    """
    payload = _decode_qr_token(req.token)

    if payload.get("type") != "exit":
        raise HTTPException(status_code=400, detail="Invalid QR type — please scan the Exit QR code")

    event_id = payload["event_id"]
    user_id = user["id"]

    # Must have entry record
    att_resp = supabase_admin.table("event_attendance").select("*").eq("user_id", user_id).eq("event_id", event_id).execute()
    if not att_resp.data or not att_resp.data[0].get("entry_verified"):
        raise HTTPException(status_code=400, detail="Entry QR must be scanned first")

    att = att_resp.data[0]

    # Prevent duplicate exit scan
    if att.get("exit_verified"):
        raise HTTPException(status_code=409, detail="Exit already recorded. Attendance is confirmed.")

    # Prevent double SIL credit
    if att.get("sil_credit"):
        raise HTTPException(status_code=409, detail="SIL credit already awarded for this event")

    # Mark attendance verified
    supabase_admin.table("event_attendance").update({
        "exit_time": datetime.utcnow().isoformat(),
        "exit_verified": True,
        "attendance_verified": True,
        "sil_credit": True,
    }).eq("id", att["id"]).execute()

    # Update interaction record
    supabase_admin.table("event_interactions").upsert({
        "user_id": user_id,
        "event_id": event_id,
        "attended": True,
    }).execute()

    # Increment SIL
    _increment_sil(user_id, event_id)

    event = _get_event_or_404(event_id)
    return {
        "message": "Attendance confirmed! ✓ SIL credit awarded.",
        "event_title": event.get("title"),
        "sil_credited": True,
        "exit_time": datetime.utcnow().isoformat(),
    }


@router.get("/attendance/my")
async def my_attendance(user: dict = Depends(get_current_user)):
    """Get attendance records for the current user."""
    resp = supabase_admin.table("event_attendance").select("*, events(title, category, date, mode, city)").eq("user_id", user["id"]).order("entry_time", desc=True).execute()
    return {"attendance": resp.data or []}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _create_qr_token(event_id: str, token_type: str, hours: int) -> str:
    payload = {
        "event_id": event_id,
        "type": token_type,
        "exp": datetime.utcnow() + timedelta(hours=hours),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, QR_SECRET, algorithm=QR_ALGORITHM)


def _decode_qr_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, QR_SECRET, algorithms=[QR_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired QR code: {str(e)}")


def _get_event_or_404(event_id: str) -> dict:
    resp = supabase_admin.table("events").select("id, title").eq("id", event_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return resp.data


def _increment_sil(user_id: str, event_id: str):
    """Increment the user's SIL participation count for the current semester."""
    try:
        # Get active semester
        sem_resp = supabase_admin.table("sil_semesters").select("id").eq("is_active", True).execute()
        if not sem_resp.data:
            return  # No active semester configured

        semester_id = sem_resp.data[0]["id"]

        # Upsert SIL record
        existing = supabase_admin.table("sil_participation").select("*").eq("user_id", user_id).eq("semester_id", semester_id).execute()
        if existing.data:
            current_count = existing.data[0].get("events_attended", 0)
            supabase_admin.table("sil_participation").update({
                "events_attended": current_count + 1,
                "last_event_id": event_id,
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase_admin.table("sil_participation").insert({
                "user_id": user_id,
                "semester_id": semester_id,
                "events_attended": 1,
                "last_event_id": event_id,
            }).execute()
    except Exception:
        pass  # SIL increment is non-critical; don't fail the scan
