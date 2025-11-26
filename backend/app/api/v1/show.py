from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.show import ShowCreate, ShowUpdate, ShowResponse
from app.services.show import ShowService
from app.utils.auth import decode_access_token
from typing import List
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/shows", tags=["Shows"])
security = HTTPBearer()

# Get the base directory (where main.py is located)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "posters"

# Create upload directory if it doesn't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


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


@router.post("/{show_id}/poster")
def upload_poster(
    show_id: int,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Upload poster for a show"""
    show_service = ShowService(db)
    
    # Verify show access
    show = show_service.get_show(show_id, user_id)
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            content = file.file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Delete old poster if exists
    if show.poster:
        old_file_path = BASE_DIR / show.poster.lstrip('/')
        if old_file_path.exists():
            try:
                old_file_path.unlink()
            except Exception as e:
                print(f"Error deleting old poster: {str(e)}")
    
    # Update show with new poster path
    poster_url = f"/uploads/posters/{unique_filename}"
    show_update = ShowUpdate(poster=poster_url)
    updated_show = show_service.update_show(show_id, show_update, user_id)
    
    return {"poster": updated_show.poster}


@router.delete("/{show_id}/poster")
def delete_poster(
    show_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete poster for a show"""
    show_service = ShowService(db)
    
    # Verify show access
    show = show_service.get_show(show_id, user_id)
    
    if not show.poster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show has no poster"
        )
    
    # Delete file
    file_path = BASE_DIR / show.poster.lstrip('/')
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Error deleting poster file: {str(e)}")
    
    # Update show to remove poster
    show_update = ShowUpdate(poster=None)
    show_service.update_show(show_id, show_update, user_id)
    
    return {"message": "Poster deleted successfully"}