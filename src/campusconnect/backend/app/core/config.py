from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # JWT (for QR tokens — separate from Supabase auth)
    jwt_secret: str = "change-this-to-a-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_qr_token_expire_hours: int = 12

    # App
    environment: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Recommendation engine
    embedding_model: str = "all-MiniLM-L6-v2"
    recommendation_limit: int = 10
    cold_start_weight: float = 0.3   # survey weight when history exists
    history_weight: float = 0.7      # interaction history weight

    # Interaction weights — all configurable in one place
    weight_viewed: int = 1
    weight_saved: int = 3
    weight_registered: int = 5
    weight_attended: int = 8
    weight_positive_rating: int = 10

    # KL University
    klu_college_id: str = "KLU"
    klu_email_domain: str = "kluniversity.in"
    sil_events_required: int = 25

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
