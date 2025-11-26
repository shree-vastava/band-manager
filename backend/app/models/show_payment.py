from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ShowPayment(Base):
    __tablename__ = "show_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False)
    
    # Member info (string since show_members can include guests not in band_members)
    member_name = Column(String, nullable=False)
    
    # Payment amount
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Optional notes (e.g., "Paid via UPI", "Pending", etc.)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    show = relationship("Show", back_populates="member_payments")