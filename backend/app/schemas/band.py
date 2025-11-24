from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class BandCreate(BaseModel):
    name: str


class BandUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    established_date: Optional[date] = None
    description: Optional[str] = None


class BandResponse(BaseModel):
    id: int
    name: str
    logo: Optional[str] = None
    established_date: Optional[date] = None
    description: Optional[str] = None
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