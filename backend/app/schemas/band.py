from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BandCreate(BaseModel):
    name: str


class BandResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BandMemberResponse(BaseModel):
    id: int
    band_id: int
    user_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True