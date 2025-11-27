from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Song(Base):
    __tablename__ = "songs"
    
    id = Column(Integer, primary_key=True, index=True)
    band_id = Column(Integer, ForeignKey("bands.id", ondelete="CASCADE"), nullable=False)
    
    # Basic Info
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Musical Info
    scale = Column(String, nullable=True)  # e.g., "C Major", "G Minor"
    genre = Column(String, nullable=True)
    
    # Content
    lyrics = Column(Text, nullable=True)
    chord_structure = Column(Text, nullable=True)
    lyrics_with_chords = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    band = relationship("Band", back_populates="songs")
    setlist_songs = relationship("SetlistSong", back_populates="song", cascade="all, delete-orphan")