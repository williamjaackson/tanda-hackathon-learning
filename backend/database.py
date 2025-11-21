import os
import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection pool
db_pool: asyncpg.Pool | None = None
async def reset_db():
    """Reset the database by dropping all existing tables"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Drop all tables in the public schema
        await connection.execute("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """)
    await init_db()
    print("✅ Database reset successfully")
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

async def init_db():
        db_pool = get_db_pool()
        async with db_pool.acquire() as connection:
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS courses (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    semester INT,
                    year INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        print("✅ Database initialized successfully")

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