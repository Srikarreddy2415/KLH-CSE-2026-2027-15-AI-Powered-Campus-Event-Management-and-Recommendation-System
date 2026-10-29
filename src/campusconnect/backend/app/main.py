from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .core.config import get_settings
from .recommendation.embeddings import embed_events
from .core.supabase import supabase_admin
from .routers import auth, events, recommendations, registrations, attendance, sil, rooms, dataset

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-load event embeddings into cache."""
    logger.info("🚀 CampusConnect backend starting up...")
    try:
        resp = supabase_admin.table("events").select("id, title, description, category, tags, city, mode").eq("is_active", True).execute()
        events_list = resp.data or []
        if events_list:
            logger.info(f"Pre-computing embeddings for {len(events_list)} events...")
            embed_events(events_list)
            logger.info(f"✅ Embedding cache ready ({len(events_list)} events)")
        else:
            logger.info("No events in DB yet — embeddings will be computed on first request")
    except Exception as e:
        logger.warning(f"Could not pre-load embeddings: {e}")
    yield
    logger.info("CampusConnect backend shutting down")


app = FastAPI(
    title="CampusConnect API",
    description="AI-Powered Campus Event Management and Recommendation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(recommendations.router)
app.include_router(registrations.router)
app.include_router(attendance.router)
app.include_router(sil.router)
app.include_router(rooms.router)
app.include_router(dataset.router)


@app.get("/")
async def root():
    return {
        "app": "CampusConnect API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "environment": settings.environment,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
