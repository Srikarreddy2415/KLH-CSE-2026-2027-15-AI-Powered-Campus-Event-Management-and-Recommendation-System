from supabase import create_client, Client
from .config import get_settings

_settings = get_settings()

# Public client — same permissions as anon users (for reads)
def get_supabase_client() -> Client:
    return create_client(_settings.supabase_url, _settings.supabase_anon_key)

# Admin client — service-role bypasses RLS (NEVER expose to frontend)
def get_supabase_admin() -> Client:
    return create_client(_settings.supabase_url, _settings.supabase_service_role_key)

# Singletons
supabase_client: Client = get_supabase_client()
supabase_admin: Client = get_supabase_admin()
