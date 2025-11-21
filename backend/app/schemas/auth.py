from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    # Remove band_name from here


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthCallback(BaseModel):
    code: str
    band_name: Optional[str] = None  # For first-time Google users


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
    has_band: bool = False  # Add this to check if user has a band
    
    class Config:
        from_attributes = True