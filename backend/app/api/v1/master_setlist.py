from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.master_setlist import (
    MasterSetlistCreate, MasterSetlistUpdate, MasterSetlistResponse,
    MasterSetlistWithSongsResponse
)
from app.services.master_setlist import MasterSetlistService
from app.utils.auth import decode_access_token
from typing import List

router = APIRouter(prefix="/setlists", tags=["Master Setlists"])
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


@router.post("/", response_model=MasterSetlistResponse)
def create_setlist(
    setlist_data: MasterSetlistCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new master setlist"""
    service = MasterSetlistService(db)
    return service.create_setlist(setlist_data, user_id)


@router.get("/band/{band_id}", response_model=List[MasterSetlistResponse])
def get_band_setlists(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all setlists for a band"""
    service = MasterSetlistService(db)
    return service.get_band_setlists(band_id, user_id)


@router.get("/{setlist_id}", response_model=MasterSetlistResponse)
def get_setlist(
    setlist_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific setlist"""
    service = MasterSetlistService(db)
    return service.get_setlist(setlist_id, user_id)


@router.get("/{setlist_id}/songs", response_model=MasterSetlistWithSongsResponse)
def get_setlist_with_songs(
    setlist_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a setlist with all its songs"""
    service = MasterSetlistService(db)
    return service.get_setlist_with_songs(setlist_id, user_id)


@router.put("/{setlist_id}", response_model=MasterSetlistResponse)
def update_setlist(
    setlist_id: int,
    setlist_data: MasterSetlistUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a setlist"""
    service = MasterSetlistService(db)
    return service.update_setlist(setlist_id, setlist_data, user_id)


@router.delete("/{setlist_id}")
def delete_setlist(
    setlist_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a setlist"""
    service = MasterSetlistService(db)
    success = service.delete_setlist(setlist_id, user_id)
    if success:
        return {"message": "Setlist deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Setlist not found"
    )