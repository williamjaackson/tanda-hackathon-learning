from fastapi import APIRouter, HTTPException, Depends
from database import get_db_pool
from api.auth import verify_access_token
router = APIRouter(prefix="/courses")


@router.get("/")
async def get_courses(user: dict = Depends(verify_access_token)):
    """Get all courses"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        courses = await connection.fetch("SELECT * FROM courses")
        return [dict(course) for course in courses]

@router.get("/{course_id}")
async def get_course(course_id: int, user: dict = Depends(verify_access_token)):
    """Get course by ID"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        course = await connection.fetchrow(
            "SELECT * FROM courses WHERE id = $1",
            course_id
        )
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course
    
@router.post("/")
async def create_course(course: dict, user: dict = Depends(verify_access_token)):
    """Create a new course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        course_id = await connection.fetchval(
            """
            INSERT INTO courses (name, code, semester, year)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            course["name"], course["code"], course.get("semester"), course.get("year")
        )
        return {"id": course_id}
@router.delete("/{course_id}")
async def delete_course(course_id: int, user: dict = Depends(verify_access_token)):
    """Delete a course by ID"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        result = await connection.execute(
            "DELETE FROM courses WHERE id = $1",
            course_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Course not found")
        return {"detail": "Course deleted successfully"}