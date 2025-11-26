from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class ShowPaymentCreate(BaseModel):
    member_name: str
    amount: Decimal
    notes: Optional[str] = None


class ShowPaymentUpdate(BaseModel):
    member_name: Optional[str] = None
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class ShowPaymentResponse(BaseModel):
    id: int
    show_id: int
    member_name: str
    amount: Decimal
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True