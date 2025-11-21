from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.auth import AuthRepository
from app.schemas.auth import UserSignup, UserLogin, Token, UserResponse
from app.utils.auth import verify_password, get_password_hash, create_access_token
from datetime import timedelta
from app.config import settings


class AuthService:
    
    def __init__(self, db: Session):
        self.db = db
        self.auth_repo = AuthRepository(db)
    
    def signup(self, signup_data: UserSignup) -> Token:
        """Register a new user (without creating a band)"""
        # Check if user already exists
        existing_user = self.auth_repo.get_user_by_email(signup_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(signup_data.password)
        user = self.auth_repo.create_user(
            email=signup_data.email,
            name=signup_data.name,
            hashed_password=hashed_password
        )
        
        # Don't create band here anymore
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(access_token=access_token)
    
    def login(self, login_data: UserLogin) -> Token:
        """Login user with email and password"""
        # Get user
        user = self.auth_repo.get_user_by_email(login_data.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not user.hashed_password or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(access_token=access_token)
    
    def get_current_user(self, user_id: int) -> UserResponse:
        """Get current user details"""
        user = self.auth_repo.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user has any bands
        has_band = len(user.band_memberships) > 0
        
        user_response = UserResponse.model_validate(user)
        user_response.has_band = has_band
        
        return user_response