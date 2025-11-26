from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class ShowStatus(str, enum.Enum):
    UPCOMING = "Upcoming"
    CANCELLED = "Cancelled"
    DONE = "Done"
    COMPLETE_PAYMENT_RECEIVED = "Complete - Payment Received"


class Show(Base):
    __tablename__ = "shows"
    
    id = Column(Integer, primary_key=True, index=True)
    band_id = Column(Integer, ForeignKey("bands.id", ondelete="CASCADE"), nullable=False)
    
    # Show Details
    venue = Column(String, nullable=False)
    show_date = Column(Date, nullable=False, index=True)
    show_time = Column(Time, nullable=True)
    event_manager = Column(String, nullable=True)  # Can be created on the go
    
    # Band Members for this show (JSON array of names - can be from band_members or free text)
    show_members = Column(Text, nullable=True)  # Stored as JSON string: ["Member1", "Member2", "Guest Artist"]
    
    # Financial
    payment = Column(Numeric(10, 2), nullable=True)  # Total amount received for the show
    band_fund_amount = Column(Numeric(10, 2), nullable=True)  # Amount saved for band fund
    
    # Band Configuration
    piece_count = Column(Integer, nullable=True)  # 4pc, 5pc, etc.
    
    # Status
    status = Column(Enum(ShowStatus), default=ShowStatus.UPCOMING, nullable=False)
    
    # Media
    poster = Column(String, nullable=True)  # URL or path to poster image
    
    # Additional Info
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    band = relationship("Band", back_populates="shows")
    member_payments = relationship("ShowPayment", back_populates="show", cascade="all, delete-orphan")
    # We'll add setlist relationship later
    # setlists = relationship("ShowSetlist", back_populates="show", cascade="all, delete-orphan")