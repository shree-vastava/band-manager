from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.show_payment import ShowPaymentRepository
from app.repositories.show import ShowRepository
from app.repositories.band import BandRepository
from app.schemas.show_payment import ShowPaymentCreate, ShowPaymentUpdate, ShowPaymentResponse
from typing import List
from decimal import Decimal


class ShowPaymentService:
    
    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = ShowPaymentRepository(db)
        self.show_repo = ShowRepository(db)
        self.band_repo = BandRepository(db)
    
    def _check_show_access(self, show_id: int, user_id: int):
        """Check if user has access to the show's band"""
        show = self.show_repo.get_show_by_id(show_id)
        if not show:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Show not found"
            )
        
        band = self.band_repo.get_band_by_id(show.band_id)
        is_member = any(
            member.user_id == user_id and member.is_active
            for member in band.members
        )
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this band"
            )
        
        return show
    
    def create_payment(
        self,
        show_id: int,
        payment_data: ShowPaymentCreate,
        user_id: int
    ) -> ShowPaymentResponse:
        """Create a new payment for a show"""
        self._check_show_access(show_id, user_id)
        
        payment = self.payment_repo.create_payment(
            show_id=show_id,
            member_name=payment_data.member_name,
            amount=payment_data.amount,
            notes=payment_data.notes
        )
        
        return ShowPaymentResponse.model_validate(payment)
    
    def get_show_payments(self, show_id: int, user_id: int) -> List[ShowPaymentResponse]:
        """Get all payments for a show"""
        self._check_show_access(show_id, user_id)
        
        payments = self.payment_repo.get_show_payments(show_id)
        return [ShowPaymentResponse.model_validate(p) for p in payments]
    
    def get_payment(self, payment_id: int, user_id: int) -> ShowPaymentResponse:
        """Get a specific payment"""
        payment = self.payment_repo.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        self._check_show_access(payment.show_id, user_id)
        
        return ShowPaymentResponse.model_validate(payment)
    
    def update_payment(
        self,
        payment_id: int,
        payment_data: ShowPaymentUpdate,
        user_id: int
    ) -> ShowPaymentResponse:
        """Update a payment"""
        payment = self.payment_repo.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        self._check_show_access(payment.show_id, user_id)
        
        updated_payment = self.payment_repo.update_payment(
            payment_id=payment_id,
            member_name=payment_data.member_name,
            amount=payment_data.amount,
            notes=payment_data.notes
        )
        
        return ShowPaymentResponse.model_validate(updated_payment)
    
    def delete_payment(self, payment_id: int, user_id: int) -> bool:
        """Delete a payment"""
        payment = self.payment_repo.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        self._check_show_access(payment.show_id, user_id)
        
        return self.payment_repo.delete_payment(payment_id)
    
    def get_payment_summary(self, show_id: int, user_id: int) -> dict:
        """Get payment summary for a show"""
        show = self._check_show_access(show_id, user_id)
        
        payments = self.payment_repo.get_show_payments(show_id)
        total_member_payments = sum(p.amount for p in payments) if payments else Decimal('0')
        
        return {
            "show_id": show_id,
            "total_payment": show.payment or Decimal('0'),
            "band_fund_amount": show.band_fund_amount or Decimal('0'),
            "total_member_payments": total_member_payments,
            "member_payments": [ShowPaymentResponse.model_validate(p) for p in payments]
        }