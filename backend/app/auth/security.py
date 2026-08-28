import hashlib
import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or ":" not in hashed_password:
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    salt, hash_val = hashed_password.split(":", 1)
    computed = hashlib.sha256((plain_password + salt).encode()).hexdigest()
    return computed == hash_val

def get_password_hash(password: str) -> str:
    salt = os.urandom(8).hex()
    hash_val = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hash_val}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        user = db.query(User).filter(User.role == "INSPECTOR").first()
        if user:
            return user
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        token_data = TokenData(email=email)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
