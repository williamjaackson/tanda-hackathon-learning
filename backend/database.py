import os
import asyncpg
import bcrypt
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

async def init_demo_user():
    """Create or update demo user account"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Hash the password "testing"
        hashed_password = bcrypt.hashpw("testing".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Check if demo user exists
        existing_user = await connection.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            "test@test.com"
        )

        if existing_user:
            # Update password in case it was changed
            await connection.execute(
                "UPDATE users SET password = $1 WHERE email = $2",
                hashed_password, "test@test.com"
            )
            print("✅ Demo user password updated")
        else:
            # Create demo user
            await connection.execute(
                """
                INSERT INTO users (email, password, name, created_at)
                VALUES ($1, $2, $3, NOW())
                """,
                "test@test.com", hashed_password, "Demo User"
            )
            print("✅ Demo user created (test@test.com / testing)")

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
                    description TEXT,
                    modules JSONB,
                    modules_status VARCHAR(50) DEFAULT 'pending',
                    modules_error TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS course_pdfs (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    pdf_data BYTEA NOT NULL,
                    summary TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS module_questions (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    module_index INTEGER NOT NULL,
                    question_text TEXT NOT NULL,
                    correct_answer_index INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS question_options (
                    id SERIAL PRIMARY KEY,
                    question_id INTEGER NOT NULL REFERENCES module_questions(id) ON DELETE CASCADE,
                    option_index INTEGER NOT NULL,
                    option_text TEXT NOT NULL
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS user_test_attempts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS user_answers (
                    id SERIAL PRIMARY KEY,
                    attempt_id INTEGER NOT NULL REFERENCES user_test_attempts(id) ON DELETE CASCADE,
                    question_id INTEGER NOT NULL REFERENCES module_questions(id) ON DELETE CASCADE,
                    selected_option_index INTEGER NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await connection.execute("""
                CREATE TABLE IF NOT EXISTS module_lessons (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    module_index INTEGER NOT NULL,
                    lesson_content TEXT NOT NULL,
                    video_url TEXT,
                    video_status VARCHAR(50) DEFAULT 'pending',
                    video_error TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(course_id, module_index)
                )
            """)
        print("✅ Database initialized successfully")

        # Create demo user after tables are created
        await init_demo_user()

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