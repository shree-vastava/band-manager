from sqlalchemy.orm import Session
from app.models.band import Band
from app.models.band_member import BandMember
from app.models.user import User
from typing import Optional, List


class BandRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_band(self, name: str, user: User) -> Band:
        """Create a new band and add the user as admin member"""
        # Create band
        band = Band(name=name)
        self.db.add(band)
        self.db.flush()
        
        # Add user as band member (admin)
        band_member = BandMember(
            band_id=band.id,
            user_id=user.id,
            role="Admin",
            is_active=True
        )
        self.db.add(band_member)
        self.db.commit()
        self.db.refresh(band)
        
        return band
    
    def get_band_by_id(self, band_id: int) -> Optional[Band]:
        """Get band by ID"""
        return self.db.query(Band).filter(Band.id == band_id).first()
    
    def get_user_bands(self, user_id: int) -> List[Band]:
        """Get all bands for a user"""
        return self.db.query(Band).join(BandMember).filter(
            BandMember.user_id == user_id,
            BandMember.is_active == True
        ).all()
    
    def update_band_name(self, band_id: int, name: str) -> Optional[Band]:
        """Update band name"""
        band = self.get_band_by_id(band_id)
        if band:
            band.name = name
            self.db.commit()
            self.db.refresh(band)
        return band