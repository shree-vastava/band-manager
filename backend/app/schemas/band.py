from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional


class BandCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None  # Musical role: Guitarist, Vocalist, etc.
    is_admin: bool = False


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
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    role: Optional[str] = None
    is_admin: bool
    is_active: bool
    joined_at: datetime
    
    class Config:
        from_attributes = True