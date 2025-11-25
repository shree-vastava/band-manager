from sqlalchemy.orm import Session
from app.models.band_member import BandMember
from typing import Optional, List


class BandMemberRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_member(self, band_id: int, name: str, email: Optional[str] = None,
                      phone: Optional[str] = None, role: Optional[str] = None,
                      is_admin: bool = False) -> BandMember:
        """Create a new band member"""
        member = BandMember(
            band_id=band_id,
            name=name,
            email=email,
            phone=phone,
            role=role,
            is_admin=is_admin,
            is_active=True
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def get_member_by_id(self, member_id: int) -> Optional[BandMember]:
        """Get member by ID"""
        return self.db.query(BandMember).filter(BandMember.id == member_id).first()
    
    def get_band_members(self, band_id: int) -> List[BandMember]:
        """Get all members for a band"""
        return self.db.query(BandMember).filter(
            BandMember.band_id == band_id,
            BandMember.is_active == True
        ).all()
    
    def get_member_by_email_and_band(self, email: str, band_id: int) -> Optional[BandMember]:
        """Get member by email within a band"""
        return self.db.query(BandMember).filter(
            BandMember.email == email,
            BandMember.band_id == band_id,
            BandMember.is_active == True
        ).first()
    
    def get_bands_by_email(self, email: str) -> List[BandMember]:
        """Get all band memberships for an email (for auto-linking on signup)"""
        return self.db.query(BandMember).filter(
            BandMember.email == email,
            BandMember.is_active == True
        ).all()
    
    def update_member(self, member_id: int, **kwargs) -> Optional[BandMember]:
        """Update member details"""
        member = self.get_member_by_id(member_id)
        if member:
            for key, value in kwargs.items():
                if value is not None and hasattr(member, key):
                    setattr(member, key, value)
            self.db.commit()
            self.db.refresh(member)
        return member
    
    def link_user_to_member(self, member_id: int, user_id: int) -> Optional[BandMember]:
        """Link a registered user to an existing member record"""
        member = self.get_member_by_id(member_id)
        if member:
            member.user_id = user_id
            self.db.commit()
            self.db.refresh(member)
        return member
    
    def delete_member(self, member_id: int) -> bool:
        """Soft delete a member (set is_active to False)"""
        member = self.get_member_by_id(member_id)
        if member:
            member.is_active = False
            self.db.commit()
            return True
        return False