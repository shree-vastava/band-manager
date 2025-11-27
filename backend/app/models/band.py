from sqlalchemy import Column, Integer, String, DateTime, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Band(Base):
    __tablename__ = "bands"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    logo = Column(String, nullable=True)
    established_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
   # Relationships
    members = relationship("BandMember", back_populates="band", cascade="all, delete-orphan")
    master_setlists = relationship("MasterSetlist", back_populates="band", cascade="all, delete-orphan")
    songs = relationship("Song", back_populates="band", cascade="all, delete-orphan")
    shows = relationship("Show", back_populates="band", cascade="all, delete-orphan")