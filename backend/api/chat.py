from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os
import json
import asyncio
from anthropic import AsyncAnthropic
from database import get_db_pool
from api.auth import verify_access_token

router = APIRouter(prefix="/chat")

# Initialize Anthropic client
anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    course_id: int
    module_index: int
    messages: List[Message]


async def generate_stream(course_id: int, module_index: int, messages: List[Message]):
    """Generate streaming chat responses using Claude API"""
    db_pool = get_db_pool()

    try:
        # Fetch course and module information for context
        async with db_pool.acquire() as connection:
            course = await connection.fetchrow(
                "SELECT name, description FROM courses WHERE id = $1",
                course_id
            )

            if not course:
                yield f"data: {{'error': 'Course not found'}}\n\n"
                return

            # Get module content
            modules_data = await connection.fetchval(
                "SELECT modules FROM courses WHERE id = $1",
                course_id
            )

            if not modules_data:
                yield f"data: {{'error': 'No modules found'}}\n\n"
                return

            # Parse JSON string to list
            modules = json.loads(modules_data) if isinstance(modules_data, str) else modules_data

            if module_index < 0 or module_index >= len(modules):
                yield f"data: {{'error': 'Module not found'}}\n\n"
                return

            module = modules[module_index]
            module_name = module.get('name', f'Module {module_index + 1}')
            module_content = module.get('content', '')

        # Prepare system message with context
        system_message = f"""You are an AI learning coach helping a student understand course material.

Course: {course['name']}
Module: {module_name}

Module Content:
{module_content}

Your role is to:
- Help students understand the concepts covered in this module
- Answer questions clearly and concisely
- Provide examples when helpful
- Encourage critical thinking
- Be supportive and encouraging

IMPORTANT FORMATTING RULES:
- You do NOT have markdown formatting available
- Use plaintext only
- Use emojis to add visual interest and clarity (e.g., ✅ ❌ 💡 🎯 📝 ⚡ 🔑)
- Use line breaks to separate ideas
- Use simple text formatting like CAPS for emphasis
- Do NOT use **bold**, *italic*, `code`, or other markdown syntax

Keep your responses focused on the course material and learning objectives."""

        # Convert messages to Anthropic format
        anthropic_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        # Stream response from Claude
        async with anthropic_client.messages.stream(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            system=system_message,
            messages=anthropic_messages,
        ) as stream:
            async for text in stream.text_stream:
                # Escape newlines in the text to prevent SSE parsing issues
                escaped_text = text.replace('\n', '\\n').replace('\r', '\\r')
                # Send each token as SSE
                yield f"data: {escaped_text}\n\n"
                await asyncio.sleep(0)  # Allow other tasks to run

        # Send end marker
        yield "data: [DONE]\n\n"

    except Exception as e:
        print(f"Error in chat stream: {str(e)}")
        yield f"data: {{'error': '{str(e)}'}}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(verify_access_token)
):
    """Stream chat responses for a specific module"""
    return StreamingResponse(
        generate_stream(request.course_id, request.module_index, request.messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering in nginx
        }
    )
