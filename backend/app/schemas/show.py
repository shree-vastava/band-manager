from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional, List
from decimal import Decimal
from enum import Enum


class ShowStatus(str, Enum):
    UPCOMING = "Upcoming"
    CANCELLED = "Cancelled"
    DONE = "Done"
    COMPLETE_PAYMENT_RECEIVED = "Complete - Payment Received"


class ShowCreate(BaseModel):
    band_id: int
    venue: str
    show_date: date
    show_time: Optional[time] = None
    event_manager: Optional[str] = None
    show_members: Optional[List[str]] = None  # List of member names (from band or free text)
    payment: Optional[Decimal] = None
    piece_count: Optional[int] = None
    status: Optional[ShowStatus] = ShowStatus.UPCOMING
    poster: Optional[str] = None
    description: Optional[str] = None


class ShowUpdate(BaseModel):
    venue: Optional[str] = None
    show_date: Optional[date] = None
    show_time: Optional[time] = None
    event_manager: Optional[str] = None
    show_members: Optional[List[str]] = None  # List of member names (from band or free text)
    payment: Optional[Decimal] = None
    piece_count: Optional[int] = None
    status: Optional[ShowStatus] = None
    poster: Optional[str] = None
    description: Optional[str] = None


class ShowResponse(BaseModel):
    id: int
    band_id: int
    venue: str
    show_date: date
    show_time: Optional[time] = None
    event_manager: Optional[str] = None
    show_members: Optional[List[str]] = None  # List of member names
    payment: Optional[Decimal] = None
    piece_count: Optional[int] = None
    status: ShowStatus
    poster: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True