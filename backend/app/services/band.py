from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.band import BandRepository
from app.repositories.auth import AuthRepository
from app.schemas.band import BandCreate, BandResponse
from typing import List


class BandService:
    
    def __init__(self, db: Session):
        self.db = db
        self.band_repo = BandRepository(db)
        self.auth_repo = AuthRepository(db)
    
    def create_band(self, band_data: BandCreate, user_id: int) -> BandResponse:
        """Create a new band for the user"""
        # Get user
        user = self.auth_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create band
        band = self.band_repo.create_band(band_data.name, user)
        
        return BandResponse.model_validate(band)
    
    def get_user_bands(self, user_id: int) -> List[BandResponse]:
        """Get all bands for a user"""
        bands = self.band_repo.get_user_bands(user_id)
        return [BandResponse.model_validate(band) for band in bands]
    
    def get_band(self, band_id: int, user_id: int) -> BandResponse:
        """Get a specific band"""
        band = self.band_repo.get_band_by_id(band_id)
        
        if not band:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Band not found"
            )
        
        # Check if user is a member of this band
        is_member = any(
            member.user_id == user_id and member.is_active 
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
        
        return BandResponse.model_validate(band)
    
    def update_band_name(self, band_id: int, name: str, user_id: int) -> BandResponse:
        """Update band name"""
        # Check if user is a member
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
        
        # Update band
        updated_band = self.band_repo.update_band_name(band_id, name)
        return BandResponse.model_validate(updated_band)