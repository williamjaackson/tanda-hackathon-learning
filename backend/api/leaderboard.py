from fastapi import APIRouter, Depends
from database import get_db_pool
from api.auth import verify_access_token

router = APIRouter(prefix="/leaderboard")


@router.get("/")
async def get_leaderboard(user: dict = Depends(verify_access_token)):
    """Get leaderboard with user statistics"""
    db_pool = get_db_pool()

    async with db_pool.acquire() as connection:
        # Get all users with their statistics
        leaderboard = await connection.fetch(
            """
            WITH user_module_passes AS (
                SELECT
                    uta.user_id,
                    uta.course_id,
                    mq.module_index
                FROM user_test_attempts uta
                JOIN user_answers ua ON ua.attempt_id = uta.id
                JOIN module_questions mq ON mq.id = ua.question_id
                WHERE uta.completed = TRUE AND ua.is_correct = TRUE
                GROUP BY uta.user_id, uta.course_id, mq.module_index
                HAVING COUNT(*) = (
                    SELECT COUNT(*)
                    FROM module_questions
                    WHERE course_id = uta.course_id AND module_index = mq.module_index
                )
            ),
            user_stats AS (
                SELECT
                    u.id,
                    u.name,
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT CASE WHEN uta.completed = TRUE THEN uta.course_id END) as completed_courses,
                    COALESCE(COUNT(DISTINCT ump.module_index || '_' || ump.course_id), 0) as total_modules_passed
                FROM users u
                LEFT JOIN courses c ON c.user_id = u.id
                LEFT JOIN user_test_attempts uta ON uta.user_id = u.id
                LEFT JOIN user_module_passes ump ON ump.user_id = u.id
                GROUP BY u.id, u.name
            )
            SELECT
                id,
                name,
                total_courses,
                completed_courses,
                total_modules_passed,
                RANK() OVER (ORDER BY completed_courses DESC, total_modules_passed DESC, total_courses DESC) as rank
            FROM user_stats
            ORDER BY rank
            """
        )

        # Get current user's rank
        current_user_entry = None
        for entry in leaderboard:
            if entry['id'] == user['user_id']:
                current_user_entry = dict(entry)
                break

        return {
            "leaderboard": [dict(row) for row in leaderboard],
            "current_user": current_user_entry
        }
