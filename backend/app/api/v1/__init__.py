from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.band import router as band_router
from app.api.v1.show import router as show_router

api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(band_router)
api_router.include_router(show_router)