from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as pyjwt
from ..core.supabase import supabase_admin

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict:
    """
    Verify a Supabase JWT access token.
    Returns the decoded payload (includes user id, email, role, etc).
    Raises 401 if missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        # Use Supabase admin to get the user — validates the token server-side
        response = supabase_admin.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": response.user.id,
            "email": response.user.email,
            "metadata": response.user.user_metadata or {},
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict | None:
    """Like get_current_user but returns None instead of raising for unauthenticated requests."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def require_college_verified(user: dict = Security(get_current_user)) -> dict:
    """Requires the user to have a verified college email."""
    profile_resp = supabase_admin.table("users_profile").select("college_verified").eq("id", user["id"]).single().execute()
    if not profile_resp.data or not profile_resp.data.get("college_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="College email verification required to access college events",
        )
    return user


async def require_organizer(user: dict = Security(get_current_user)) -> dict:
    """Requires organizer or admin role."""
    profile_resp = supabase_admin.table("users_profile").select("role").eq("id", user["id"]).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None
    if role not in ("organizer", "admin"):
        raise HTTPException(status_code=403, detail="Organizer access required")
    return user


async def require_admin(user: dict = Security(get_current_user)) -> dict:
    """Requires admin role."""
    profile_resp = supabase_admin.table("users_profile").select("role").eq("id", user["id"]).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
