from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.band_member import BandMemberCreate, BandMemberUpdate, BandMemberResponse
from app.services.band_member import BandMemberService
from app.utils.auth import decode_access_token
from typing import List
from fastapi import UploadFile, File
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/bands/{band_id}/members", tags=["Band Members"])
security = HTTPBearer()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "profiles"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
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


@router.post("/", response_model=BandMemberResponse)
def create_member(
    band_id: int,
    member_data: BandMemberCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a new member to the band (admin only)"""
    service = BandMemberService(db)
    return service.create_member(band_id, member_data, user_id)


@router.get("/", response_model=List[BandMemberResponse])
def get_members(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all members of a band"""
    service = BandMemberService(db)
    return service.get_band_members(band_id, user_id)


@router.put("/{member_id}", response_model=BandMemberResponse)
def update_member(
    band_id: int,
    member_id: int,
    member_data: BandMemberUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a band member (admin only)"""
    service = BandMemberService(db)
    return service.update_member(member_id, member_data, user_id)


@router.delete("/{member_id}")
def delete_member(
    band_id: int,
    member_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a member from the band (admin only)"""
    service = BandMemberService(db)
    success = service.delete_member(member_id, user_id)
    if success:
        return {"message": "Member removed successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Member not found"
    )

@router.post("/{member_id}/profile-picture")
def upload_profile_picture(
    band_id: int,
    member_id: int,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Upload profile picture for a band member"""
    service = BandMemberService(db)
    service._check_admin_access(band_id, user_id)
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed. Use jpg, jpeg, png, gif, or webp"
        )
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    from app.repositories.band_member import BandMemberRepository
    member_repo = BandMemberRepository(db)
    member = member_repo.update_member(member_id, profile_picture=f"/uploads/profiles/{unique_filename}")
    
    return {"profile_picture": member.profile_picture}