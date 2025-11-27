from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.master_setlist import MasterSetlistRepository
from app.repositories.setlist_song import SetlistSongRepository
from app.repositories.band import BandRepository
from app.schemas.master_setlist import (
    MasterSetlistCreate, MasterSetlistUpdate, MasterSetlistResponse,
    MasterSetlistWithSongsResponse, SongBriefResponse
)
from typing import List


class MasterSetlistService:
    
    def __init__(self, db: Session):
        self.db = db
        self.setlist_repo = MasterSetlistRepository(db)
        self.setlist_song_repo = SetlistSongRepository(db)
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
    
    def create_setlist(self, setlist_data: MasterSetlistCreate, user_id: int) -> MasterSetlistResponse:
        """Create a new master setlist"""
        self._check_band_access(setlist_data.band_id, user_id)
        
        setlist = self.setlist_repo.create_setlist(
            band_id=setlist_data.band_id,
            name=setlist_data.name,
            description=setlist_data.description
        )
        
        response = MasterSetlistResponse.model_validate(setlist)
        response.song_count = 0
        return response
    
    def get_band_setlists(self, band_id: int, user_id: int) -> List[MasterSetlistResponse]:
        """Get all setlists for a band"""
        self._check_band_access(band_id, user_id)
        
        results = self.setlist_repo.get_band_setlists_with_song_count(band_id)
        
        response_list = []
        for setlist, song_count in results:
            response = MasterSetlistResponse.model_validate(setlist)
            response.song_count = song_count
            response_list.append(response)
        
        return response_list
    
    def get_setlist(self, setlist_id: int, user_id: int) -> MasterSetlistResponse:
        """Get a specific setlist"""
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        self._check_band_access(setlist.band_id, user_id)
        
        result = self.setlist_repo.get_setlist_with_song_count(setlist_id)
        response = MasterSetlistResponse.model_validate(result[0])
        response.song_count = result[1]
        return response
    
    def get_setlist_with_songs(self, setlist_id: int, user_id: int) -> MasterSetlistWithSongsResponse:
        """Get a setlist with all its songs"""
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        self._check_band_access(setlist.band_id, user_id)
        
        # Get songs with positions
        songs_with_positions = self.setlist_song_repo.get_setlist_songs(setlist_id)
        print(f"DEBUG: Found {len(songs_with_positions)} songs for setlist {setlist_id}")
        print(f"DEBUG: Songs: {songs_with_positions}")
        song_responses = []
        for song, position in songs_with_positions:
            song_brief = SongBriefResponse(
                id=song.id,
                title=song.title,
                scale=song.scale,
                genre=song.genre,
                position=position
            )
            song_responses.append(song_brief)
        
        response = MasterSetlistWithSongsResponse.model_validate(setlist)
        response.song_count = len(song_responses)
        response.songs = song_responses
        return response
    
    def update_setlist(self, setlist_id: int, setlist_data: MasterSetlistUpdate, user_id: int) -> MasterSetlistResponse:
        """Update setlist details"""
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        self._check_band_access(setlist.band_id, user_id)
        
        updated_setlist = self.setlist_repo.update_setlist(
            setlist_id=setlist_id,
            name=setlist_data.name,
            description=setlist_data.description
        )
        
        result = self.setlist_repo.get_setlist_with_song_count(setlist_id)
        response = MasterSetlistResponse.model_validate(result[0])
        response.song_count = result[1]
        return response
    
    def delete_setlist(self, setlist_id: int, user_id: int) -> bool:
        """Delete a setlist"""
        setlist = self.setlist_repo.get_setlist_by_id(setlist_id)
        
        if not setlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setlist not found"
            )
        
        self._check_band_access(setlist.band_id, user_id)
        
        return self.setlist_repo.delete_setlist(setlist_id)