from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import init_db_pool, close_db_pool
from api import example

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool() # Startup: Create database connection pool
    yield
    await close_db_pool() # Shutdown: Close database connection pool

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# Mount API routes
app.include_router(example.router)