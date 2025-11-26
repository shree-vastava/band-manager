from sqlalchemy.orm import Session
from app.models.show_payment import ShowPayment
from typing import Optional, List
from decimal import Decimal


class ShowPaymentRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_payment(
        self,
        show_id: int,
        member_name: str,
        amount: Decimal,
        notes: Optional[str] = None
    ) -> ShowPayment:
        """Create a new show payment record"""
        payment = ShowPayment(
            show_id=show_id,
            member_name=member_name,
            amount=amount,
            notes=notes
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
    
    def get_payment_by_id(self, payment_id: int) -> Optional[ShowPayment]:
        """Get payment by ID"""
        return self.db.query(ShowPayment).filter(ShowPayment.id == payment_id).first()
    
    def get_show_payments(self, show_id: int) -> List[ShowPayment]:
        """Get all payments for a show"""
        return self.db.query(ShowPayment).filter(
            ShowPayment.show_id == show_id
        ).order_by(ShowPayment.created_at.desc()).all()
    
    def update_payment(
        self,
        payment_id: int,
        member_name: Optional[str] = None,
        amount: Optional[Decimal] = None,
        notes: Optional[str] = None
    ) -> Optional[ShowPayment]:
        """Update payment details"""
        payment = self.db.query(ShowPayment).filter(ShowPayment.id == payment_id).first()
        if payment:
            if member_name is not None:
                payment.member_name = member_name
            if amount is not None:
                payment.amount = amount
            if notes is not None:
                payment.notes = notes
            
            self.db.commit()
            self.db.refresh(payment)
        return payment
    
    def delete_payment(self, payment_id: int) -> bool:
        """Delete a payment record"""
        payment = self.db.query(ShowPayment).filter(ShowPayment.id == payment_id).first()
        if payment:
            self.db.delete(payment)
            self.db.commit()
            return True
        return False
    
    def get_total_payments_for_show(self, show_id: int) -> Decimal:
        """Get total of all member payments for a show"""
        payments = self.get_show_payments(show_id)
        return sum(p.amount for p in payments) if payments else Decimal('0')