from sqlalchemy.orm import Session
from app.models.show import Show, ShowStatus
from typing import Optional, List
from datetime import date, time
from decimal import Decimal
import json


class ShowRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_show(self, band_id: int, venue: str, show_date: date,
                   show_time: Optional[time] = None, event_manager: Optional[str] = None,
                   show_members: Optional[List[str]] = None, payment: Optional[Decimal] = None,
                   band_fund_amount: Optional[Decimal] = None,
                   piece_count: Optional[int] = None, status: Optional[ShowStatus] = ShowStatus.UPCOMING,
                   poster: Optional[str] = None, description: Optional[str] = None) -> Show:
        """Create a new show"""
        # Convert show_members list to JSON string
        show_members_json = json.dumps(show_members) if show_members else None
        
        show = Show(
            band_id=band_id,
            venue=venue,
            show_date=show_date,
            show_time=show_time,
            event_manager=event_manager,
            show_members=show_members_json,
            payment=payment,
            band_fund_amount=band_fund_amount,
            piece_count=piece_count,
            status=status,
            poster=poster,
            description=description
        )
        self.db.add(show)
        self.db.commit()
        self.db.refresh(show)
        
        # Convert JSON string back to list for response
        if show.show_members:
            try:
                parsed = json.loads(show.show_members)
                show.show_members = parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                show.show_members = []
        
        return show
    
    def get_show_by_id(self, show_id: int) -> Optional[Show]:
        """Get show by ID"""
        show = self.db.query(Show).filter(Show.id == show_id).first()
        if show and show.show_members:
            try:
                parsed = json.loads(show.show_members)
                # Ensure it's a list, not a dict or other type
                show.show_members = parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                show.show_members = []
        return show
    
    def get_band_shows(self, band_id: int) -> List[Show]:
        """Get all shows for a band, ordered by date descending"""
        shows = self.db.query(Show).filter(
            Show.band_id == band_id
        ).order_by(Show.show_date.desc()).all()
        
        # Convert JSON strings to lists
        for show in shows:
            if show.show_members:
                try:
                    parsed = json.loads(show.show_members)
                    # Ensure it's a list, not a dict or other type
                    show.show_members = parsed if isinstance(parsed, list) else []
                except (json.JSONDecodeError, TypeError):
                    show.show_members = []
        
        return shows
    
    def update_show(self, show_id: int, venue: Optional[str] = None,
                   show_date: Optional[date] = None, show_time: Optional[time] = None,
                   event_manager: Optional[str] = None, show_members: Optional[List[str]] = None,
                   payment: Optional[Decimal] = None, band_fund_amount: Optional[Decimal] = None,
                   piece_count: Optional[int] = None, status: Optional[ShowStatus] = None,
                   poster: Optional[str] = None, description: Optional[str] = None) -> Optional[Show]:
        """Update show details"""
        show = self.db.query(Show).filter(Show.id == show_id).first()
        if show:
            if venue is not None:
                show.venue = venue
            if show_date is not None:
                show.show_date = show_date
            if show_time is not None:
                show.show_time = show_time
            if event_manager is not None:
                show.event_manager = event_manager
            if show_members is not None:
                show.show_members = json.dumps(show_members)
            if payment is not None:
                show.payment = payment
            if band_fund_amount is not None:
                show.band_fund_amount = band_fund_amount
            if piece_count is not None:
                show.piece_count = piece_count
            if status is not None:
                show.status = status
            if poster is not None:
                show.poster = poster
            if description is not None:
                show.description = description
            
            self.db.commit()
            self.db.refresh(show)
            
            # Convert JSON string back to list for response
            if show.show_members:
                try:
                    parsed = json.loads(show.show_members)
                    # Ensure it's a list, not a dict or other type
                    show.show_members = parsed if isinstance(parsed, list) else []
                except (json.JSONDecodeError, TypeError):
                    show.show_members = []
        
        return show
    
    def delete_show(self, show_id: int) -> bool:
        """Delete a show"""
        show = self.db.query(Show).filter(Show.id == show_id).first()
        if show:
            self.db.delete(show)
            self.db.commit()
            return True
        return False
    
    def get_total_band_fund(self, band_id: int) -> Decimal:
        """Get total band fund amount for a band (sum of all shows' band_fund_amount)"""
        shows = self.db.query(Show).filter(
            Show.band_id == band_id,
            Show.band_fund_amount.isnot(None)
        ).all()
        
        total = sum(show.band_fund_amount for show in shows if show.band_fund_amount)
        return total if total else Decimal('0')