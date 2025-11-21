from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from database import get_db_pool
import bcrypt
import jwt
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/auth")

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Request/Response Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(request: SignUpRequest):
    """Register a new user"""
    try:
        db_pool = get_db_pool()
        async with db_pool.acquire() as connection:
            # Check if user already exists
            existing_user = await connection.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                request.email
            )
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Hash password and create user
            hashed_password = hash_password(request.password)
            user = await connection.fetchrow(
                """
                INSERT INTO users (email, password, name, created_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING id, email, name, created_at
                """,
                request.email, hashed_password, request.name
            )
            
            # Generate access token
            access_token = create_access_token({"sub": user["email"], "user_id": user["id"]})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "created_at": user["created_at"].isoformat()
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {str(e)}"
        )

@router.post("/signin", response_model=AuthResponse)
async def sign_in(request: SignInRequest):
    """Authenticate a user and return access token"""
    try:
        db_pool = get_db_pool()
        async with db_pool.acquire() as connection:
            # Fetch user by email
            user = await connection.fetchrow(
                "SELECT id, email, password, name, created_at FROM users WHERE email = $1",
                request.email
            )
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Verify password
            if not verify_password(request.password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Generate access token
            access_token = create_access_token({"sub": user["email"], "user_id": user["id"]})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "created_at": user["created_at"].isoformat()
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

@router.get("/tables")
async def list_tables():
    """List all tables in the database"""
    
    try:
        db_pool = get_db_pool()
        async with db_pool.acquire() as connection:
            tables = await connection.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
       
            return {
                "tables": [dict(table) for table in tables],
                "count": len(tables),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")