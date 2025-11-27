from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SetlistSong(Base):
    __tablename__ = "setlist_songs"
    
    id = Column(Integer, primary_key=True, index=True)
    setlist_id = Column(Integer, ForeignKey("master_setlists.id", ondelete="CASCADE"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)
    
    # Position for ordering songs within a setlist
    position = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    setlist = relationship("MasterSetlist", back_populates="setlist_songs")
    song = relationship("Song", back_populates="setlist_songs")