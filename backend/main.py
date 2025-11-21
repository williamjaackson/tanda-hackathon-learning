from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db_pool, close_db_pool, init_db, reset_db
from api import example, auth, course

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool() # Startup: Create database connection pool
    await reset_db()  # Reset database for a clean state
    await init_db()
    yield
    await close_db_pool() # Shutdown: Close database connection pool

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# Mount API routes
app.include_router(example.router)
app.include_router(auth.router, prefix="/api")
app.include_router(course.router, prefix="/api")