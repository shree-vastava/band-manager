from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class MasterSetlistCreate(BaseModel):
    band_id: int
    name: str
    description: Optional[str] = None


class MasterSetlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MasterSetlistResponse(BaseModel):
    id: int
    band_id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    song_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class MasterSetlistWithSongsResponse(MasterSetlistResponse):
    songs: List["SongBriefResponse"] = []


# Brief song response for nested use (avoids circular import)
class SongBriefResponse(BaseModel):
    id: int
    title: str
    scale: Optional[str] = None
    genre: Optional[str] = None
    position: Optional[int] = 0
    
    class Config:
        from_attributes = True


# Update forward reference
MasterSetlistWithSongsResponse.model_rebuild()