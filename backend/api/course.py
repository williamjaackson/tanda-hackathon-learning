from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
from database import get_db_pool
from api.auth import verify_access_token
from utils.pdf_summarizer import summarize_pdf_with_claude

router = APIRouter(prefix="/courses")


async def summarize_single_pdf(pdf_id: int, pdf_bytes: bytes, filename: str):
    """Background task to summarize a single PDF and update the database"""
    try:
        # Generate summary using Claude
        summary = await summarize_pdf_with_claude(pdf_bytes, filename)

        # Update the PDF record with the summary
        db_pool = get_db_pool()
        async with db_pool.acquire() as connection:
            await connection.execute(
                """
                UPDATE course_pdfs
                SET summary = $1
                WHERE id = $2
                """,
                summary, pdf_id
            )
        print(f"✅ Summarized PDF: {filename}")
    except Exception as e:
        print(f"❌ Error summarizing PDF {filename}: {e}")


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
async def create_course(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    code: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    user: dict = Depends(verify_access_token)
):
    """Create a new course with optional PDFs (summaries generated in background)"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Create the course
        course_id = await connection.fetchval(
            """
            INSERT INTO courses (name, code, description)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            name, code, description
        )

        # Store PDFs immediately without summaries, then schedule background summarization
        for file in files:
            if file.filename and file.filename.endswith('.pdf'):
                pdf_bytes = await file.read()

                # Store PDF without summary first
                pdf_id = await connection.fetchval(
                    """
                    INSERT INTO course_pdfs (course_id, filename, pdf_data, summary)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                    """,
                    course_id, file.filename, pdf_bytes, None
                )

                # Schedule summarization in background for this specific PDF
                background_tasks.add_task(summarize_single_pdf, pdf_id, pdf_bytes, file.filename)

        return {"id": course_id}

@router.get("/{course_id}/pdfs")
async def get_course_pdfs(course_id: int, user: dict = Depends(verify_access_token)):
    """Get all PDFs and summaries for a course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        pdfs = await connection.fetch(
            """
            SELECT id, filename, summary, created_at
            FROM course_pdfs
            WHERE course_id = $1
            ORDER BY created_at DESC
            """,
            course_id
        )
        return [dict(pdf) for pdf in pdfs]

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