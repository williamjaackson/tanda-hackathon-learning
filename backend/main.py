from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from database import init_db_pool, close_db_pool, init_db, reset_db
from api import example, auth, course, test
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool() # Startup: Create database connection pool
    await init_db() # Initialize database tables if they don't exist
    yield
    await close_db_pool() # Shutdown: Close database connection pool

app = FastAPI(lifespan=lifespan)

# Configure CORS with specific origins
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# Mount API routes
app.include_router(example.router)
app.include_router(auth.router, prefix="/api")
app.include_router(course.router, prefix="/api")
app.include_router(test.router, prefix="/api")

# Create static directory if it doesn't exist
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
(static_dir / "videos").mkdir(exist_ok=True)

# Mount static files for serving videos
app.mount("/videos", StaticFiles(directory="static/videos"), name="videos")