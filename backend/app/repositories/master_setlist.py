from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.master_setlist import MasterSetlist
from app.models.setlist_song import SetlistSong
from typing import Optional, List
from datetime import datetime


class MasterSetlistRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_setlist(self, band_id: int, name: str, description: Optional[str] = None) -> MasterSetlist:
        """Create a new master setlist"""
        setlist = MasterSetlist(
            band_id=band_id,
            name=name,
            description=description
        )
        self.db.add(setlist)
        self.db.commit()
        self.db.refresh(setlist)
        return setlist
    
    def get_setlist_by_id(self, setlist_id: int) -> Optional[MasterSetlist]:
        """Get setlist by ID"""
        return self.db.query(MasterSetlist).filter(
            MasterSetlist.id == setlist_id,
            MasterSetlist.is_active == True
        ).first()
    
    def get_band_setlists(self, band_id: int) -> List[MasterSetlist]:
        """Get all setlists for a band"""
        return self.db.query(MasterSetlist).filter(
            MasterSetlist.band_id == band_id,
            MasterSetlist.is_active == True
        ).order_by(MasterSetlist.name).all()
    
    def get_setlist_with_song_count(self, setlist_id: int) -> Optional[tuple]:
        """Get setlist with song count"""
        result = self.db.query(
            MasterSetlist,
            func.count(SetlistSong.id).label('song_count')
        ).outerjoin(SetlistSong).filter(
            MasterSetlist.id == setlist_id,
            MasterSetlist.is_active == True
        ).group_by(MasterSetlist.id).first()
        
        return result
    
    def get_band_setlists_with_song_count(self, band_id: int) -> List[tuple]:
        """Get all setlists for a band with song counts"""
        return self.db.query(
            MasterSetlist,
            func.count(SetlistSong.id).label('song_count')
        ).outerjoin(SetlistSong).filter(
            MasterSetlist.band_id == band_id,
            MasterSetlist.is_active == True
        ).group_by(MasterSetlist.id).order_by(MasterSetlist.name).all()
    
    def update_setlist(self, setlist_id: int, name: Optional[str] = None,
                       description: Optional[str] = None) -> Optional[MasterSetlist]:
        """Update setlist details"""
        setlist = self.get_setlist_by_id(setlist_id)
        if setlist:
            if name is not None:
                setlist.name = name
            if description is not None:
                setlist.description = description
            setlist.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(setlist)
        return setlist
    
    def delete_setlist(self, setlist_id: int) -> bool:
        """Soft delete a setlist"""
        setlist = self.get_setlist_by_id(setlist_id)
        if setlist:
            setlist.is_active = False
            setlist.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False