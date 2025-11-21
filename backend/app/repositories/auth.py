from sqlalchemy.orm import Session
from app.models.user import User
from app.models.band import Band
from app.models.band_member import BandMember
from typing import Optional


class AuthRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return self.db.query(User).filter(User.google_id == google_id).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, email: str, name: str, hashed_password: Optional[str] = None, 
                    google_id: Optional[str] = None) -> User:
        """Create a new user"""
        user = User(
            email=email,
            name=name,
            hashed_password=hashed_password,
            google_id=google_id
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def create_band_with_member(self, band_name: str, user: User) -> Band:
        """Create a band and add the user as a member"""
        # Create band
        band = Band(name=band_name)
        self.db.add(band)
        self.db.flush()  # Get band.id without committing
        
        # Add user as band member
        band_member = BandMember(
            band_id=band.id,
            user_id=user.id,
            role="Admin",  # First user is admin
            is_active=True
        )
        self.db.add(band_member)
        self.db.commit()
        self.db.refresh(band)
        
        return band