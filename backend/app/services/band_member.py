from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.band_member import BandMemberRepository
from app.repositories.band import BandRepository
from app.schemas.band_member import BandMemberCreate, BandMemberUpdate, BandMemberResponse
from typing import List


class BandMemberService:
    
    def __init__(self, db: Session):
        self.db = db
        self.member_repo = BandMemberRepository(db)
        self.band_repo = BandRepository(db)
    
    def _check_admin_access(self, band_id: int, user_id: int) -> None:
        """Check if user is an admin of the band"""
        band = self.band_repo.get_band_by_id(band_id)
        if not band:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Band not found"
            )
        
        is_admin = any(
            member.user_id == user_id and member.is_admin and member.is_active
            for member in band.members
        )
        
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can manage band members"
            )
    
    def _check_member_access(self, band_id: int, user_id: int) -> None:
        """Check if user is a member of the band"""
        band = self.band_repo.get_band_by_id(band_id)
        if not band:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Band not found"
            )
        
        is_member = any(
            member.user_id == user_id and member.is_active
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
    
    def create_member(self, band_id: int, member_data: BandMemberCreate, user_id: int) -> BandMemberResponse:
        """Create a new band member (admin only)"""
        self._check_admin_access(band_id, user_id)
        
        # Check if email already exists in this band
        if member_data.email:
            existing = self.member_repo.get_member_by_email_and_band(member_data.email, band_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A member with this email already exists in this band"
                )
        
        member = self.member_repo.create_member(
            band_id=band_id,
            name=member_data.name,
            email=member_data.email,
            phone=member_data.phone,
            role=member_data.role,
            is_admin=member_data.is_admin
        )
        
        return BandMemberResponse.model_validate(member)
    
    def get_band_members(self, band_id: int, user_id: int) -> List[BandMemberResponse]:
        """Get all members of a band"""
        self._check_member_access(band_id, user_id)
        
        members = self.member_repo.get_band_members(band_id)
        return [BandMemberResponse.model_validate(m) for m in members]
    
    def update_member(self, member_id: int, member_data: BandMemberUpdate, user_id: int) -> BandMemberResponse:
        """Update a band member (admin only)"""
        member = self.member_repo.get_member_by_id(member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        self._check_admin_access(member.band_id, user_id)
        
        update_data = member_data.model_dump(exclude_unset=True)
        updated_member = self.member_repo.update_member(member_id, **update_data)
        
        return BandMemberResponse.model_validate(updated_member)
    
    def delete_member(self, member_id: int, user_id: int) -> bool:
        """Delete a band member (admin only)"""
        member = self.member_repo.get_member_by_id(member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        self._check_admin_access(member.band_id, user_id)
        
        # Prevent deleting yourself if you're the only admin
        if member.user_id == user_id:
            band = self.band_repo.get_band_by_id(member.band_id)
            admin_count = sum(1 for m in band.members if m.is_admin and m.is_active)
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the only admin. Transfer admin rights first."
                )
        
        return self.member_repo.delete_member(member_id)