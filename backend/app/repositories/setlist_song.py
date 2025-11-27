from sqlalchemy.orm import Session
from app.models.setlist_song import SetlistSong
from app.models.song import Song
from typing import Optional, List


class SetlistSongRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def add_song_to_setlist(self, setlist_id: int, song_id: int, position: Optional[int] = None) -> SetlistSong:
        """Add a song to a setlist"""
        # If no position provided, add to end
        if position is None:
            max_position = self.db.query(SetlistSong).filter(
                SetlistSong.setlist_id == setlist_id
            ).count()
            position = max_position
        
        setlist_song = SetlistSong(
            setlist_id=setlist_id,
            song_id=song_id,
            position=position
        )
        self.db.add(setlist_song)
        self.db.commit()
        self.db.refresh(setlist_song)
        return setlist_song
    
    def remove_song_from_setlist(self, setlist_id: int, song_id: int) -> bool:
        """Remove a song from a setlist"""
        setlist_song = self.db.query(SetlistSong).filter(
            SetlistSong.setlist_id == setlist_id,
            SetlistSong.song_id == song_id
        ).first()
        
        if setlist_song:
            self.db.delete(setlist_song)
            self.db.commit()
            return True
        return False
    
    def get_setlist_songs(self, setlist_id: int) -> List[tuple]:
            """Get all songs in a setlist with their positions"""
            results = self.db.query(Song, SetlistSong.position).join(
                SetlistSong, Song.id == SetlistSong.song_id
            ).filter(
                SetlistSong.setlist_id == setlist_id
            ).order_by(SetlistSong.position).all()
            
            return results
    
    def get_song_setlist_entry(self, setlist_id: int, song_id: int) -> Optional[SetlistSong]:
        """Get a specific setlist-song entry"""
        return self.db.query(SetlistSong).filter(
            SetlistSong.setlist_id == setlist_id,
            SetlistSong.song_id == song_id
        ).first()
    
    def is_song_in_setlist(self, setlist_id: int, song_id: int) -> bool:
        """Check if a song is already in a setlist"""
        return self.get_song_setlist_entry(setlist_id, song_id) is not None
    
    def update_song_position(self, setlist_id: int, song_id: int, position: int) -> Optional[SetlistSong]:
        """Update a song's position in a setlist"""
        setlist_song = self.get_song_setlist_entry(setlist_id, song_id)
        if setlist_song:
            setlist_song.position = position
            self.db.commit()
            self.db.refresh(setlist_song)
        return setlist_song
    
    def reorder_songs(self, setlist_id: int, song_ids: List[int]) -> bool:
        """Reorder all songs in a setlist based on provided order"""
        for position, song_id in enumerate(song_ids):
            setlist_song = self.get_song_setlist_entry(setlist_id, song_id)
            if setlist_song:
                setlist_song.position = position
        self.db.commit()
        return True
    
    def get_setlists_for_song(self, song_id: int) -> List[int]:
        """Get all setlist IDs that contain a song"""
        results = self.db.query(SetlistSong.setlist_id).filter(
            SetlistSong.song_id == song_id
        ).all()
        return [r[0] for r in results]