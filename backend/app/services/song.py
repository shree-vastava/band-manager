from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.song import SongRepository
from app.repositories.setlist_song import SetlistSongRepository
from app.repositories.master_setlist import MasterSetlistRepository
from app.repositories.band import BandRepository
from app.schemas.song import (
    SongCreate, SongUpdate, SongResponse,
    SongWithSetlistsResponse, SetlistBriefResponse
)
from typing import List


class SongService:
    
    def __init__(self, db: Session):
        self.db = db
        self.song_repo = SongRepository(db)
        self.setlist_song_repo = SetlistSongRepository(db)
        self.setlist_repo = MasterSetlistRepository(db)
        self.band_repo = BandRepository(db)
    
    def _check_band_access(self, band_id: int, user_id: int) -> None:
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
    
    def create_song(self, song_data: SongCreate, user_id: int) -> SongWithSetlistsResponse:
        """Create a new song, optionally adding to setlists"""
        self._check_band_access(song_data.band_id, user_id)
        
        # Create the song
        song = self.song_repo.create_song(
            band_id=song_data.band_id,
            title=song_data.title,
            description=song_data.description,
            scale=song_data.scale,
            genre=song_data.genre,
            lyrics=song_data.lyrics,
            chord_structure=song_data.chord_structure,
            lyrics_with_chords=song_data.lyrics_with_chords,
            is_active=song_data.is_active if song_data.is_active is not None else True
        )
        
        # Add to setlists if provided
        setlists = []
        if song_data.setlist_ids:
            for setlist_id in song_data.setlist_ids:
                setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
                if setlist and setlist.band_id == song_data.band_id:
                    self.setlist_song_repo.add_song_to_setlist(setlist_id, song.id)
                    setlists.append(SetlistBriefResponse(id=setlist.id, name=setlist.name))
        
        response = SongWithSetlistsResponse.model_validate(song)
        response.setlists = setlists
        return response
    
    def get_band_songs(self, band_id: int, user_id: int) -> List[SongWithSetlistsResponse]:
        """Get all songs for a band with their setlists"""
        self._check_band_access(band_id, user_id)
    
        results = self.song_repo.get_band_songs_with_setlists(band_id, include_inactive=True)
        
        response_list = []
        for song, setlists in results:
            response = SongWithSetlistsResponse.model_validate(song)
            response.setlists = [
                SetlistBriefResponse(id=s.id, name=s.name) for s in setlists
            ]
            response_list.append(response)
        
        return response_list
    
    def get_song(self, song_id: int, user_id: int) -> SongWithSetlistsResponse:
        """Get a specific song with its setlists"""
        song = self.song_repo.get_song_by_id(song_id)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        result = self.song_repo.get_song_with_setlists(song_id)
        response = SongWithSetlistsResponse.model_validate(result[0])
        response.setlists = [
            SetlistBriefResponse(id=s.id, name=s.name) for s in result[1]
        ]
        return response
    
    def update_song(self, song_id: int, song_data: SongUpdate, user_id: int) -> SongWithSetlistsResponse:
        """Update song details"""
        song = self.song_repo.get_song_by_id(song_id)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        updated_song = self.song_repo.update_song(
                song_id=song_id,
                title=song_data.title,
                description=song_data.description,
                scale=song_data.scale,
                genre=song_data.genre,
                lyrics=song_data.lyrics,
                chord_structure=song_data.chord_structure,
                lyrics_with_chords=song_data.lyrics_with_chords,
                is_active=song_data.is_active
            )
        result = self.song_repo.get_song_with_setlists(song_id)
        response = SongWithSetlistsResponse.model_validate(result[0])
        response.setlists = [
            SetlistBriefResponse(id=s.id, name=s.name) for s in result[1]
        ]
        return response
    
    def delete_song(self, song_id: int, user_id: int) -> bool:
        """Delete a song"""
        song = self.song_repo.get_song_by_id(song_id)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        return self.song_repo.delete_song(song_id)
    
    def add_song_to_setlist(self, song_id: int, setlist_id: int, user_id: int, position: int = None) -> bool:
        """Add an existing song to a setlist"""
        song = self.song_repo.get_song_by_id(song_id)
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        # Ensure both belong to same band
        if song.band_id != setlist.band_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Song and setlist must belong to the same band"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        # Check if already in setlist
        if self.setlist_song_repo.is_song_in_setlist(setlist_id, song_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Song is already in this setlist"
            )
        
        self.setlist_song_repo.add_song_to_setlist(setlist_id, song_id, position)
        return True
    
    def remove_song_from_setlist(self, song_id: int, setlist_id: int, user_id: int) -> bool:
        """Remove a song from a setlist"""
        song = self.song_repo.get_song_by_id(song_id)
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        return self.setlist_song_repo.remove_song_from_setlist(setlist_id, song_id)
    
    def update_song_setlists(self, song_id: int, setlist_ids: List[int], user_id: int) -> SongWithSetlistsResponse:
        """Update which setlists a song belongs to"""
        song = self.song_repo.get_song_by_id(song_id)
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        self._check_band_access(song.band_id, user_id)
        
        # Get current setlist IDs
        current_setlist_ids = self.setlist_song_repo.get_setlists_for_song(song_id)
        
        # Remove from setlists not in new list
        for setlist_id in current_setlist_ids:
            if setlist_id not in setlist_ids:
                self.setlist_song_repo.remove_song_from_setlist(setlist_id, song_id)
        
        # Add to new setlists
        for setlist_id in setlist_ids:
            if setlist_id not in current_setlist_ids:
                setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
                if setlist and setlist.band_id == song.band_id:
                    self.setlist_song_repo.add_song_to_setlist(setlist_id, song_id)
        
        # Return updated song
        result = self.song_repo.get_song_with_setlists(song_id)
        response = SongWithSetlistsResponse.model_validate(result[0])
        response.setlists = [
            SetlistBriefResponse(id=s.id, name=s.name) for s in result[1]
        ]
        return response