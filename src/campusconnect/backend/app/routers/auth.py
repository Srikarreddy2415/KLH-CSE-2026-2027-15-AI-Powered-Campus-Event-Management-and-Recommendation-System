from fastapi import APIRouter, HTTPException, Depends, status
from ..models.schemas import RegisterRequest, LoginRequest, SurveyRequest, CollegeVerifyRequest
from ..core.supabase import supabase_admin, supabase_client
from ..core.auth import get_current_user
from ..core.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register")
async def register(req: RegisterRequest):
    """Register a new user via Supabase Auth + create profile row."""
    try:
        # 1. Create auth user
        auth_resp = supabase_admin.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,   # skip email confirmation in dev
            "user_metadata": {"name": req.name},
        })
        user = auth_resp.user
        if not user:
            raise HTTPException(status_code=400, detail="Failed to create user")

        # 2. Create profile row
        supabase_admin.table("users_profile").insert({
            "id": user.id,
            "name": req.name,
            "email": req.email,
            "role": "student",
            "college_verified": False,
            "onboarding_completed": False,
        }).execute()

        return {"message": "Registration successful", "user_id": user.id}

    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/login")
async def login(req: LoginRequest):
    """Sign in via Supabase Auth — returns JWT access token."""
    try:
        resp = supabase_client.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        if not resp.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Fetch profile
        profile_resp = supabase_admin.table("users_profile").select("*").eq("id", resp.user.id).single().execute()

        return {
            "access_token": resp.session.access_token,
            "refresh_token": resp.session.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": resp.user.id,
                "email": resp.user.email,
            },
            "profile": profile_resp.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/survey")
async def submit_survey(req: SurveyRequest, user: dict = Depends(get_current_user)):
    """Save onboarding survey preferences."""
    try:
        # Step 1: Ensure users_profile row exists (for users registered before schema)
        existing = supabase_admin.table("users_profile").select("id").eq("id", user["id"]).execute()
        if not existing.data:
            # Fetch details from Supabase Auth
            auth_user = supabase_admin.auth.admin.get_user_by_id(user["id"])
            email = auth_user.user.email if auth_user and auth_user.user else ""
            name = (auth_user.user.user_metadata or {}).get("name", email.split("@")[0]) if auth_user and auth_user.user else "User"
            supabase_admin.table("users_profile").insert({
                "id": user["id"],
                "name": name,
                "email": email,
                "role": "student",
                "college_verified": False,
                "onboarding_completed": False,
            }).execute()

        # Step 2: Upsert preferences
        pref_existing = supabase_admin.table("user_preferences").select("id").eq("user_id", user["id"]).execute()
        if pref_existing.data:
            supabase_admin.table("user_preferences").update({
                "interests": req.interests,
                "preferred_mode": req.preferred_mode,
                "preferred_location": req.preferred_location,
            }).eq("user_id", user["id"]).execute()
        else:
            supabase_admin.table("user_preferences").insert({
                "user_id": user["id"],
                "interests": req.interests,
                "preferred_mode": req.preferred_mode,
                "preferred_location": req.preferred_location,
            }).execute()

        # Step 3: Mark onboarding complete
        supabase_admin.table("users_profile").update({
            "onboarding_completed": True,
            "location": req.preferred_location,
        }).eq("id", user["id"]).execute()

        return {"message": "Survey saved successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Survey save failed: {str(e)}")


@router.post("/verify-college")
async def request_college_verification(
    college_email: str,
    user: dict = Depends(get_current_user)
):
    """
    Request college email verification.
    Dev mode: returns OTP code in response (replace with actual email in production).
    """
    settings_obj = get_settings()

    # Check email domain matches a known college
    domain = college_email.split("@")[-1].lower()
    college_resp = supabase_admin.table("colleges").select("id, name").eq("email_domain", domain).execute()
    if not college_resp.data:
        raise HTTPException(status_code=400, detail=f"Email domain @{domain} is not a registered college domain")

    college = college_resp.data[0]

    # Store pending verification
    supabase_admin.table("users_profile").update({
        "college_email": college_email,
        "college_id": college["id"],
    }).eq("id", user["id"]).execute()

    # Dev mode OTP — in production, send via email
    dev_otp = "123456"

    return {
        "message": f"Verification initiated for {college['name']}",
        "college": college["name"],
        "dev_note": f"[DEV MODE] OTP is: {dev_otp} — replace with real email in production",
        "otp": dev_otp if settings_obj.environment == "development" else None,
    }


@router.post("/verify-college/confirm")
async def confirm_college_verification(
    req: CollegeVerifyRequest,
    user: dict = Depends(get_current_user)
):
    """Confirm college email with OTP."""
    # Dev mode: accept fixed OTP
    valid_otp = "123456"
    if req.otp != valid_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    supabase_admin.table("users_profile").update({
        "college_verified": True,
    }).eq("id", user["id"]).execute()

    return {"message": "College email verified successfully", "college_verified": True}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    profile_resp = supabase_admin.table("users_profile").select("*").eq("id", user["id"]).single().execute()
    prefs_resp = supabase_admin.table("user_preferences").select("*").eq("user_id", user["id"]).execute()
    return {
        "profile": profile_resp.data,
        "preferences": prefs_resp.data[0] if prefs_resp.data else None,
    }
