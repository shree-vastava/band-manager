from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.band import router as band_router
from app.api.v1.show import router as show_router
from app.api.v1.band_member import router as band_member_router
from app.api.v1.show_payment import router as show_payment_router
from app.api.v1.master_setlist import router as master_setlist_router
from app.api.v1.song import router as song_router

api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(band_router)
api_router.include_router(show_router)
api_router.include_router(band_member_router)
api_router.include_router(show_payment_router)
api_router.include_router(master_setlist_router)
api_router.include_router(song_router)