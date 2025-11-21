from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class BandMember(Base):
    __tablename__ = "band_members"
    
    id = Column(Integer, primary_key=True, index=True)
    band_id = Column(Integer, ForeignKey("bands.id", ondelete="CASCADE"), nullable=False)
    
    # For registered users
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # For non-user members (session musicians, etc.)
    name = Column(String, nullable=True)  # Only needed if user_id is null
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Common fields
    role = Column(String, nullable=True)  # e.g., "Guitarist", "Vocalist", "Manager"
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="band_memberships")
    band = relationship("Band", back_populates="members")