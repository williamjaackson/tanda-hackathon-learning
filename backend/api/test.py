from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from database import get_db_pool
from api.auth import verify_access_token

router = APIRouter(prefix="/tests")


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option_index: int  # -1 for "I'm unsure"


class TestSubmission(BaseModel):
    answers: List[AnswerSubmission]


@router.get("/{course_id}/questions")
async def get_test_questions(course_id: int, user: dict = Depends(verify_access_token)):
    """Get all knowledge test questions for a course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Check if course exists
        course = await connection.fetchrow(
            "SELECT id FROM courses WHERE id = $1",
            course_id
        )
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Fetch all questions with their options
        questions = await connection.fetch(
            """
            SELECT q.id, q.module_index, q.question_text
            FROM module_questions q
            WHERE q.course_id = $1
            ORDER BY q.module_index, q.id
            """,
            course_id
        )

        result = []
        for question in questions:
            # Fetch options for this question
            options = await connection.fetch(
                """
                SELECT option_index, option_text
                FROM question_options
                WHERE question_id = $1
                ORDER BY option_index
                """,
                question['id']
            )

            result.append({
                "id": question['id'],
                "module_index": question['module_index'],
                "question_text": question['question_text'],
                "options": [opt['option_text'] for opt in options]
            })

        return result


@router.post("/{course_id}/start")
async def start_test_attempt(course_id: int, user: dict = Depends(verify_access_token)):
    """Start a new test attempt for a course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Check if course exists
        course = await connection.fetchrow(
            "SELECT id FROM courses WHERE id = $1",
            course_id
        )
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Create new test attempt
        attempt_id = await connection.fetchval(
            """
            INSERT INTO user_test_attempts (user_id, course_id, completed)
            VALUES ($1, $2, FALSE)
            RETURNING id
            """,
            user['user_id'],
            course_id
        )

        return {"attempt_id": attempt_id}


@router.post("/{course_id}/submit")
async def submit_test(
    course_id: int,
    submission: TestSubmission,
    user: dict = Depends(verify_access_token)
):
    """Submit test answers and get results"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Get or create active test attempt
        attempt = await connection.fetchrow(
            """
            SELECT id FROM user_test_attempts
            WHERE user_id = $1 AND course_id = $2 AND completed = FALSE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            user['user_id'],
            course_id
        )

        if not attempt:
            # Create new attempt if none exists
            attempt_id = await connection.fetchval(
                """
                INSERT INTO user_test_attempts (user_id, course_id, completed)
                VALUES ($1, $2, TRUE)
                RETURNING id
                """,
                user['user_id'],
                course_id
            )
        else:
            attempt_id = attempt['id']

        # Process each answer
        module_results = {}  # Track results per module

        for answer in submission.answers:
            # Get correct answer for this question
            question = await connection.fetchrow(
                """
                SELECT correct_answer_index, module_index
                FROM module_questions
                WHERE id = $1
                """,
                answer.question_id
            )

            if not question:
                continue

            # Check if answer is correct (-1 means "I'm unsure", which is wrong)
            is_correct = (
                answer.selected_option_index != -1 and
                answer.selected_option_index == question['correct_answer_index']
            )

            # Store the answer
            await connection.execute(
                """
                INSERT INTO user_answers (attempt_id, question_id, selected_option_index, is_correct)
                VALUES ($1, $2, $3, $4)
                """,
                attempt_id,
                answer.question_id,
                answer.selected_option_index,
                is_correct
            )

            # Track module results
            module_idx = question['module_index']
            if module_idx not in module_results:
                module_results[module_idx] = {"total": 0, "correct": 0}

            module_results[module_idx]["total"] += 1
            if is_correct:
                module_results[module_idx]["correct"] += 1

        # Mark attempt as completed
        await connection.execute(
            "UPDATE user_test_attempts SET completed = TRUE WHERE id = $1",
            attempt_id
        )

        # Calculate which modules were passed (all questions correct)
        passed_modules = [
            module_idx
            for module_idx, results in module_results.items()
            if results["correct"] == results["total"]
        ]

        return {
            "attempt_id": attempt_id,
            "module_results": module_results,
            "passed_modules": passed_modules
        }


@router.get("/{course_id}/status")
async def get_test_status(course_id: int, user: dict = Depends(verify_access_token)):
    """Get user's test completion status for a course"""
    db_pool = get_db_pool()
    async with db_pool.acquire() as connection:
        # Get the most recent completed test attempt
        attempt = await connection.fetchrow(
            """
            SELECT id FROM user_test_attempts
            WHERE user_id = $1 AND course_id = $2 AND completed = TRUE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            user['user_id'],
            course_id
        )

        if not attempt:
            return {"has_completed": False, "passed_modules": []}

        # Get all answers for this attempt
        answers = await connection.fetch(
            """
            SELECT ua.is_correct, mq.module_index
            FROM user_answers ua
            JOIN module_questions mq ON ua.question_id = mq.id
            WHERE ua.attempt_id = $1
            """,
            attempt['id']
        )

        # Calculate which modules were passed
        module_results = {}
        for answer in answers:
            module_idx = answer['module_index']
            if module_idx not in module_results:
                module_results[module_idx] = {"total": 0, "correct": 0}

            module_results[module_idx]["total"] += 1
            if answer['is_correct']:
                module_results[module_idx]["correct"] += 1

        passed_modules = [
            module_idx
            for module_idx, results in module_results.items()
            if results["correct"] == results["total"]
        ]

        return {
            "has_completed": True,
            "passed_modules": passed_modules,
            "module_results": module_results
        }
