from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SongCreate(BaseModel):
    band_id: int
    title: str
    description: Optional[str] = None
    scale: Optional[str] = None
    genre: Optional[str] = None
    lyrics: Optional[str] = None
    chord_structure: Optional[str] = None
    lyrics_with_chords: Optional[str] = None
    is_active: Optional[bool] = True
    setlist_ids: Optional[List[int]] = None  # Optional setlists to add song to


class SongUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scale: Optional[str] = None
    genre: Optional[str] = None
    lyrics: Optional[str] = None
    chord_structure: Optional[str] = None
    lyrics_with_chords: Optional[str] = None
    is_active: Optional[bool] = None

class SongResponse(BaseModel):
    id: int
    band_id: int
    title: str
    description: Optional[str] = None
    scale: Optional[str] = None
    genre: Optional[str] = None
    lyrics: Optional[str] = None
    chord_structure: Optional[str] = None
    lyrics_with_chords: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SongWithSetlistsResponse(SongResponse):
    setlists: List["SetlistBriefResponse"] = []


# Brief setlist response for nested use
class SetlistBriefResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


# Update forward reference
SongWithSetlistsResponse.model_rebuild()