import os
import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection pool
db_pool: asyncpg.Pool | None = None

async def init_db_pool():
    """Initialize the database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=os.getenv("POSTGRES_HOST", "postgres"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
            database=os.getenv("POSTGRES_DB", "postgres"),
            min_size=1,
            max_size=10,
        )
        print("✅ Database connection pool created successfully")
    except Exception as e:
        print(f"❌ Failed to create database connection pool: {e}")
        raise


async def close_db_pool():
    """Close the database connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        print("✅ Database connection pool closed")


def get_db_pool() -> asyncpg.Pool:
    """Get the database connection pool"""
    if not db_pool:
        raise RuntimeError("Database connection pool not initialized")
    return db_pool