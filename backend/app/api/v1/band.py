from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.band import BandCreate, BandResponse, BandUpdate
from app.services.band import BandService
from app.utils.auth import decode_access_token
from typing import List
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/bands", tags=["Bands"])
security = HTTPBearer()

# Get the base directory (where main.py is located)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "logos"

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
def update_band(
    band_id: int,
    band_data: BandUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update band details"""
    band_service = BandService(db)
    return band_service.update_band(band_id, band_data, user_id)


@router.post("/{band_id}/logo")
def upload_logo(
    band_id: int,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Upload band logo"""
    band_service = BandService(db)
    
    # Verify band access
    band = band_service.get_band(band_id, user_id)
    
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
    
    # Delete old logo if exists
    if band.logo:
        old_file_path = BASE_DIR / band.logo.lstrip('/')
        if old_file_path.exists():
            try:
                old_file_path.unlink()
            except Exception as e:
                print(f"Error deleting old logo: {str(e)}")
    
    # Update band with new logo path
    logo_url = f"/uploads/logos/{unique_filename}"
    updated_band = band_service.update_band(band_id, BandUpdate(logo=logo_url), user_id)
    
    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url,
        "band": updated_band
    }


@router.delete("/{band_id}/logo")
def delete_logo(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete band logo"""
    band_service = BandService(db)
    
    # Get band and verify access
    band = band_service.get_band(band_id, user_id)
    
    if not band.logo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Band has no logo"
        )
    
    # Delete file
    file_path = BASE_DIR / band.logo.lstrip('/')
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Error deleting logo file: {str(e)}")
    
    # Update band to remove logo
    updated_band = band_service.update_band(band_id, BandUpdate(logo=None), user_id)
    
    return {
        "message": "Logo deleted successfully",
        "band": updated_band
    }


@router.delete("/{band_id}")
def delete_band(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a band"""
    band_service = BandService(db)
    
    # Get band and verify access
    band = band_service.get_band(band_id, user_id)
    
    # Delete logo file if exists
    if band.logo:
        relative_path = band.logo.lstrip('/')
        file_path = BASE_DIR / relative_path
        
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Error deleting logo file: {str(e)}")
    
    # Delete band from database (cascade will delete related records)
    band_service.delete_band(band_id, user_id)
    
    return {"message": "Band deleted successfully"}