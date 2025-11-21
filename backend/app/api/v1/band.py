from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.band import BandCreate, BandResponse
from app.services.band import BandService
from app.utils.auth import decode_access_token
from typing import List

router = APIRouter(prefix="/bands", tags=["Bands"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extract user ID from token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return int(user_id)


@router.post("/", response_model=BandResponse)
def create_band(
    band_data: BandCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new band"""
    band_service = BandService(db)
    return band_service.create_band(band_data, user_id)


@router.get("/", response_model=List[BandResponse])
def get_user_bands(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all bands for the current user"""
    band_service = BandService(db)
    return band_service.get_user_bands(user_id)


@router.get("/{band_id}", response_model=BandResponse)
def get_band(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific band"""
    band_service = BandService(db)
    return band_service.get_band(band_id, user_id)


@router.put("/{band_id}", response_model=BandResponse)
def update_band_name(
    band_id: int,
    band_data: BandCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update band name"""
    band_service = BandService(db)
    return band_service.update_band_name(band_id, band_data.name, user_id)