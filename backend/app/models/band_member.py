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
    email = Column(String, nullable=True, index=True)  # Added index for email lookup
    phone = Column(String, nullable=True)
    
    # Profile
    profile_picture = Column(String, nullable=True)  # URL or path to profile image
    
    # Musical role (e.g., "Guitarist", "Vocalist", "Drummer")
    role = Column(String, nullable=True)
    
    # Permission level
    is_admin = Column(Boolean, default=False)  # Can manage band, add/remove members
    
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="band_memberships")
    band = relationship("Band", back_populates="members")