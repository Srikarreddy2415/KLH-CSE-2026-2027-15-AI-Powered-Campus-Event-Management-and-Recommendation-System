from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


# ─── Auth ─────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CollegeVerifyRequest(BaseModel):
    college_email: str
    otp: str


# ─── User / Survey ────────────────────────────────────────────────────────────
class SurveyRequest(BaseModel):
    interests: list[str]
    preferred_mode: str = "both"
    preferred_location: str = ""


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── Events ───────────────────────────────────────────────────────────────────
class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: list[str] = []
    event_type: str = "general"
    location: str
    city: str
    date: str
    start_time: str
    end_time: str
    mode: str = "offline"
    college_scope: bool = False
    college_id: Optional[str] = None
    expected_participants: Optional[int] = None
    capacity: Optional[int] = None
    organizer: str
    room_id: Optional[str] = None
    poster_url: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    mode: Optional[str] = None
    capacity: Optional[int] = None
    expected_participants: Optional[int] = None
    is_active: Optional[bool] = None
    room_id: Optional[str] = None


# ─── Recommendations ──────────────────────────────────────────────────────────
class ColdStartRequest(BaseModel):
    interests: list[str]
    preferred_mode: str = "both"
    preferred_location: str = ""
    college_id: Optional[str] = None
    college_verified: bool = False


# ─── Registrations ───────────────────────────────────────────────────────────
class RegisterEventRequest(BaseModel):
    event_id: str


class SaveEventRequest(BaseModel):
    event_id: str


class RateEventRequest(BaseModel):
    event_id: str
    rating: int  # 1-5

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


# ─── Attendance / QR ──────────────────────────────────────────────────────────
class QRScanRequest(BaseModel):
    token: str


# ─── Rooms ───────────────────────────────────────────────────────────────────
class RoomAvailabilityRequest(BaseModel):
    date: str
    start_time: str
    end_time: str
    capacity: int
    college_id: str = "KLU"


class RoomCreate(BaseModel):
    block_id: str
    room_number: str
    capacity: int
    room_type: str = "classroom"  # classroom | lab | auditorium | seminar_hall
    floor: Optional[int] = None
    amenities: list[str] = []
    is_sample_data: bool = True   # flag to indicate placeholder data


# ─── Admin ───────────────────────────────────────────────────────────────────
class CollegeCreate(BaseModel):
    name: str
    short_name: str
    email_domain: str
    city: str
    state: str


class BlockCreate(BaseModel):
    college_id: str
    name: str
    short_name: str
