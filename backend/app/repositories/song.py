from sqlalchemy.orm import Session
from app.models.song import Song
from app.models.setlist_song import SetlistSong
from app.models.master_setlist import MasterSetlist
from typing import Optional, List
from datetime import datetime


class SongRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_song(self, band_id: int, title: str, description: Optional[str] = None,
                    scale: Optional[str] = None, genre: Optional[str] = None,
                    lyrics: Optional[str] = None, chord_structure: Optional[str] = None,
                    lyrics_with_chords: Optional[str] = None, is_active: bool = True) -> Song:
        """Create a new song"""
        song = Song(
            band_id=band_id,
            title=title,
            description=description,
            scale=scale,
            genre=genre,
            lyrics=lyrics,
            chord_structure=chord_structure,
            lyrics_with_chords=lyrics_with_chords,
            is_active=is_active
        )
        self.db.add(song)
        self.db.commit()
        self.db.refresh(song)
        return song
    
    def get_song_by_id(self, song_id: int) -> Optional[Song]:
        """Get song by ID (including inactive)"""
        return self.db.query(Song).filter(Song.id == song_id).first()
    
    def get_band_songs(self, band_id: int, include_inactive: bool = True) -> List[Song]:
        """Get all songs for a band"""
        query = self.db.query(Song).filter(Song.band_id == band_id)
        
        if not include_inactive:
            query = query.filter(Song.is_active == True)
        
        return query.order_by(Song.title).all()
    
    def get_song_with_setlists(self, song_id: int) -> Optional[tuple]:
        """Get song with its setlists"""
        song = self.get_song_by_id(song_id)
        if song:
            setlists = self.db.query(MasterSetlist).join(SetlistSong).filter(
                SetlistSong.song_id == song_id,
                MasterSetlist.is_active == True
            ).all()
            return song, setlists
        return None
    
    def get_band_songs_with_setlists(self, band_id: int, include_inactive: bool = True) -> List[tuple]:
        """Get all songs for a band with their setlists"""
        songs = self.get_band_songs(band_id, include_inactive)
        result = []
        for song in songs:
            setlists = self.db.query(MasterSetlist).join(SetlistSong).filter(
                SetlistSong.song_id == song.id,
                MasterSetlist.is_active == True
            ).all()
            result.append((song, setlists))
        return result
    
    def update_song(self, song_id: int, title: Optional[str] = None,
                    description: Optional[str] = None, scale: Optional[str] = None,
                    genre: Optional[str] = None, lyrics: Optional[str] = None,
                    chord_structure: Optional[str] = None,
                    lyrics_with_chords: Optional[str] = None,
                    is_active: Optional[bool] = None) -> Optional[Song]:
        """Update song details"""
        song = self.get_song_by_id(song_id)
        
        if song:
            if title is not None:
                song.title = title
            if description is not None:
                song.description = description
            if scale is not None:
                song.scale = scale
            if genre is not None:
                song.genre = genre
            if lyrics is not None:
                song.lyrics = lyrics
            if chord_structure is not None:
                song.chord_structure = chord_structure
            if lyrics_with_chords is not None:
                song.lyrics_with_chords = lyrics_with_chords
            if is_active is not None:
                song.is_active = is_active
            song.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(song)
        return song
    
    def delete_song(self, song_id: int) -> bool:
        """Soft delete a song"""
        song = self.get_song_by_id(song_id)
        if song:
            song.is_active = False
            song.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False