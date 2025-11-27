from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SetlistSongAdd(BaseModel):
    song_id: int
    position: Optional[int] = None


class SetlistSongRemove(BaseModel):
    song_id: int


class SetlistSongUpdatePosition(BaseModel):
    song_id: int
    position: int


class SetlistSongReorder(BaseModel):
    song_ids: List[int]  # Ordered list of song IDs


class SetlistSongResponse(BaseModel):
    id: int
    setlist_id: int
    song_id: int
    position: int
    created_at: datetime
    
    class Config:
        from_attributes = True