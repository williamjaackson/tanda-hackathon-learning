from fastapi import APIRouter, HTTPException
from database import get_db_pool

router = APIRouter(prefix="/example")

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