from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.song import (
    SongCreate, SongUpdate, SongResponse, SongWithSetlistsResponse
)
from app.services.song import SongService
from app.utils.auth import decode_access_token
from typing import List

router = APIRouter(prefix="/songs", tags=["Songs"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extract user ID from token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return int(user_id)


@router.post("/", response_model=SongWithSetlistsResponse)
def create_song(
    song_data: SongCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new song, optionally adding to setlists"""
    service = SongService(db)
    return service.create_song(song_data, user_id)


@router.get("/band/{band_id}", response_model=List[SongWithSetlistsResponse])
def get_band_songs(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all songs for a band"""
    service = SongService(db)
    return service.get_band_songs(band_id, user_id)


@router.get("/{song_id}", response_model=SongWithSetlistsResponse)
def get_song(
    song_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific song"""
    service = SongService(db)
    return service.get_song(song_id, user_id)


@router.put("/{song_id}", response_model=SongWithSetlistsResponse)
def update_song(
    song_id: int,
    song_data: SongUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a song"""
    service = SongService(db)
    return service.update_song(song_id, song_data, user_id)


@router.delete("/{song_id}")
def delete_song(
    song_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a song"""
    service = SongService(db)
    success = service.delete_song(song_id, user_id)
    if success:
        return {"message": "Song deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Song not found"
    )


@router.post("/{song_id}/setlists/{setlist_id}")
def add_song_to_setlist(
    song_id: int,
    setlist_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a song to a setlist"""
    service = SongService(db)
    service.add_song_to_setlist(song_id, setlist_id, user_id)
    return {"message": "Song added to setlist successfully"}


@router.delete("/{song_id}/setlists/{setlist_id}")
def remove_song_from_setlist(
    song_id: int,
    setlist_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a song from a setlist"""
    service = SongService(db)
    success = service.remove_song_from_setlist(song_id, setlist_id, user_id)
    if success:
        return {"message": "Song removed from setlist successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Song not found in setlist"
    )


@router.put("/{song_id}/setlists", response_model=SongWithSetlistsResponse)
def update_song_setlists(
    song_id: int,
    setlist_ids: List[int],
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update which setlists a song belongs to"""
    service = SongService(db)
    return service.update_song_setlists(song_id, setlist_ids, user_id)