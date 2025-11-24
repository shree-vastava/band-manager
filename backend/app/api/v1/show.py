from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.show import ShowCreate, ShowUpdate, ShowResponse
from app.services.show import ShowService
from app.utils.auth import decode_access_token
from typing import List

router = APIRouter(prefix="/shows", tags=["Shows"])
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


@router.post("/", response_model=ShowResponse)
def create_show(
    show_data: ShowCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new show"""
    show_service = ShowService(db)
    return show_service.create_show(show_data, user_id)


@router.get("/band/{band_id}", response_model=List[ShowResponse])
def get_band_shows(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all shows for a band"""
    show_service = ShowService(db)
    return show_service.get_band_shows(band_id, user_id)


@router.get("/{show_id}", response_model=ShowResponse)
def get_show(
    show_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific show"""
    show_service = ShowService(db)
    return show_service.get_show(show_id, user_id)


@router.put("/{show_id}", response_model=ShowResponse)
def update_show(
    show_id: int,
    show_data: ShowUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update show details"""
    show_service = ShowService(db)
    return show_service.update_show(show_id, show_data, user_id)


@router.delete("/{show_id}")
def delete_show(
    show_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a show"""
    show_service = ShowService(db)
    success = show_service.delete_show(show_id, user_id)
    if success:
        return {"message": "Show deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found"
        )