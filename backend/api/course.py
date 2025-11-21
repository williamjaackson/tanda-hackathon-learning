from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
import json
from database import get_db_pool
from api.auth import verify_access_token
from utils.pdf_summarizer import summarize_pdf_with_claude
from utils.module_generator import generate_course_modules

router = APIRouter(prefix="/courses")


async def check_and_generate_modules(course_id: int):
    """Check if all PDFs have summaries, and if so, generate course modules"""
    db_pool = get_db_pool()

    try:
        async with db_pool.acquire() as connection:
            # Check if all PDFs have summaries
            pending_pdfs = await connection.fetchval(
                """
                SELECT COUNT(*)
                FROM course_pdfs
                WHERE course_id = $1 AND summary IS NULL
                """,
                course_id
            )

            if pending_pdfs > 0:
                print(f"⏳ Course {course_id}: Still waiting for {pending_pdfs} PDF summaries")
                return

            # Check current module status
            status = await connection.fetchval(
                "SELECT modules_status FROM courses WHERE id = $1",
                course_id
            )

            if status == 'generating':
                print(f"ℹ️ Course {course_id}: Module generation already in progress")
                return

            if status == 'completed':
                print(f"ℹ️ Course {course_id}: Modules already generated")
                return

            # Set status to generating
            await connection.execute(
                "UPDATE courses SET modules_status = 'generating', modules_error = NULL WHERE id = $1",
                course_id
            )

            # Fetch course info and PDF summaries
            course = await connection.fetchrow(
                "SELECT name, description FROM courses WHERE id = $1",
                course_id
            )

            pdfs = await connection.fetch(
                """
                SELECT filename, summary
                FROM course_pdfs
                WHERE course_id = $1
                """,
                course_id
            )

            if not pdfs:
                await connection.execute(
                    "UPDATE courses SET modules_status = 'error', modules_error = $1 WHERE id = $2",
                    "No PDFs to generate modules from",
                    course_id
                )
                print(f"⚠️ Course {course_id}: No PDFs to generate modules from")
                return

        # Generate modules using Claude Sonnet (outside DB connection)
        pdf_summaries = [{"filename": pdf["filename"], "summary": pdf["summary"]} for pdf in pdfs]
        modules = await generate_course_modules(
            course["name"],
            course["description"] or "",
            pdf_summaries
        )

        # Store result
        async with db_pool.acquire() as connection:
            if modules:
                await connection.execute(
                    "UPDATE courses SET modules = $1, modules_status = 'completed' WHERE id = $2",
                    json.dumps(modules),
                    course_id
                )
                print(f"✅ Course {course_id}: Generated {len(modules)} modules")
            else:
                await connection.execute(
                    "UPDATE courses SET modules_status = 'error', modules_error = $1 WHERE id = $2",
                    "Failed to generate valid modules from course content",
                    course_id
                )
                print(f"⚠️ Course {course_id}: Failed to generate modules")

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error generating modules for course {course_id}: {error_msg}")
        try:
            async with db_pool.acquire() as connection:
                await connection.execute(
                    "UPDATE courses SET modules_status = 'error', modules_error = $1 WHERE id = $2",
                    error_msg,
                    course_id
                )
        except Exception as db_error:
            print(f"❌ Failed to update error status: {db_error}")


async def summarize_single_pdf(pdf_id: int, pdf_bytes: bytes, filename: str, course_id: int):
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

        # Check if all PDFs are done and generate modules if so
        await check_and_generate_modules(course_id)

    except Exception as e:
        print(f"❌ Error summarizing PDF {filename}: {e}")


@router.get("/")
async def get_courses(user: dict = Depends(verify_access_token)):
    """Get all courses"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        courses = await connection.fetch("SELECT * FROM courses")
        result = []
        for course in courses:
            course_dict = dict(course)
            # Parse modules JSON string to array
            if course_dict.get('modules'):
                course_dict['modules'] = json.loads(course_dict['modules'])
            result.append(course_dict)
        return result

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
        course_dict = dict(course)
        # Parse modules JSON string to array
        if course_dict.get('modules'):
            course_dict['modules'] = json.loads(course_dict['modules'])
        return course_dict
    
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
                background_tasks.add_task(summarize_single_pdf, pdf_id, pdf_bytes, file.filename, course_id)

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

@router.post("/{course_id}/retry-modules")
async def retry_module_generation(
    course_id: int,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_access_token)
):
    """Retry module generation for a course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Check if course exists
        course = await connection.fetchrow(
            "SELECT id FROM courses WHERE id = $1",
            course_id
        )
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Reset status to pending
        await connection.execute(
            "UPDATE courses SET modules_status = 'pending', modules_error = NULL WHERE id = $1",
            course_id
        )

    # Trigger module generation in background
    background_tasks.add_task(check_and_generate_modules, course_id)

    return {"detail": "Module generation queued"}

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