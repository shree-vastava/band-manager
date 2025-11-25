from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class BandMemberCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None  # Musical role: Guitarist, Vocalist, etc.
    is_admin: bool = False


class BandMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None


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