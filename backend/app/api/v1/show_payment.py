from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.show_payment import ShowPaymentCreate, ShowPaymentUpdate, ShowPaymentResponse
from app.services.show_payment import ShowPaymentService
from app.utils.auth import decode_access_token
from typing import List

router = APIRouter(prefix="/shows/{show_id}/payments", tags=["Show Payments"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extract user ID from token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return int(user_id)


@router.post("/", response_model=ShowPaymentResponse)
def create_payment(
    show_id: int,
    payment_data: ShowPaymentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new payment for a show member"""
    service = ShowPaymentService(db)
    return service.create_payment(show_id, payment_data, user_id)


@router.get("/", response_model=List[ShowPaymentResponse])
def get_show_payments(
    show_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all payments for a show"""
    service = ShowPaymentService(db)
    return service.get_show_payments(show_id, user_id)


@router.get("/summary")
def get_payment_summary(
    show_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get payment summary for a show (total, band fund, member payments)"""
    service = ShowPaymentService(db)
    return service.get_payment_summary(show_id, user_id)


@router.get("/{payment_id}", response_model=ShowPaymentResponse)
def get_payment(
    show_id: int,
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific payment"""
    service = ShowPaymentService(db)
    return service.get_payment(payment_id, user_id)


@router.put("/{payment_id}", response_model=ShowPaymentResponse)
def update_payment(
    show_id: int,
    payment_id: int,
    payment_data: ShowPaymentUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a payment"""
    service = ShowPaymentService(db)
    return service.update_payment(payment_id, payment_data, user_id)


@router.delete("/{payment_id}")
def delete_payment(
    show_id: int,
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a payment"""
    service = ShowPaymentService(db)
    success = service.delete_payment(payment_id, user_id)
    if success:
        return {"message": "Payment deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Payment not found"
    )