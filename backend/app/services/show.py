from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.show import ShowRepository
from app.repositories.band import BandRepository
from app.schemas.show import ShowCreate, ShowUpdate, ShowResponse
from typing import List


class ShowService:
    
    def __init__(self, db: Session):
        self.db = db
        self.show_repo = ShowRepository(db)
        self.band_repo = BandRepository(db)
    
    def create_show(self, show_data: ShowCreate, user_id: int) -> ShowResponse:
        """Create a new show"""
        # Get band and check if user is a member
        band = self.band_repo.get_band_by_id(show_data.band_id)
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
        
        # Create show
        show = self.show_repo.create_show(
            band_id=show_data.band_id,
            venue=show_data.venue,
            show_date=show_data.show_date,
            show_time=show_data.show_time,
            event_manager=show_data.event_manager,
            show_members=show_data.show_members,
            payment=show_data.payment,
            piece_count=show_data.piece_count,
            status=show_data.status,
            poster=show_data.poster,
            description=show_data.description
        )
        
        return ShowResponse.model_validate(show)
    
    def get_band_shows(self, band_id: int, user_id: int) -> List[ShowResponse]:
        """Get all shows for a band"""
        # Check if user is a member of the band
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
        
        shows = self.show_repo.get_band_shows(band_id)
        return [ShowResponse.model_validate(show) for show in shows]
    
    def get_show(self, show_id: int, user_id: int) -> ShowResponse:
        """Get a specific show"""
        show = self.show_repo.get_show_by_id(show_id)
        
        if not show:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Show not found"
            )
        
        # Check if user is a member of the band
        band = self.band_repo.get_band_by_id(show.band_id)
        is_member = any(
            member.user_id == user_id and member.is_active 
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
        
        return ShowResponse.model_validate(show)
    
    def update_show(self, show_id: int, show_data: ShowUpdate, user_id: int) -> ShowResponse:
        """Update show details"""
        show = self.show_repo.get_show_by_id(show_id)
        
        if not show:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Show not found"
            )
        
        # Check if user is a member of the band
        band = self.band_repo.get_band_by_id(show.band_id)
        is_member = any(
            member.user_id == user_id and member.is_active 
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
        
        # Update show
        updated_show = self.show_repo.update_show(
            show_id=show_id,
            venue=show_data.venue,
            show_date=show_data.show_date,
            show_time=show_data.show_time,
            event_manager=show_data.event_manager,
            show_members=show_data.show_members,
            payment=show_data.payment,
            piece_count=show_data.piece_count,
            status=show_data.status,
            poster=show_data.poster,
            description=show_data.description
        )
        
        return ShowResponse.model_validate(updated_show)
    
    def delete_show(self, show_id: int, user_id: int) -> bool:
        """Delete a show"""
        show = self.show_repo.get_show_by_id(show_id)
        
        if not show:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Show not found"
            )
        
        # Check if user is a member of the band
        band = self.band_repo.get_band_by_id(show.band_id)
        is_member = any(
            member.user_id == user_id and member.is_active 
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
        
        return self.show_repo.delete_show(show_id)