import os
import json
import asyncio
from anthropic import AsyncAnthropic

# Use async client for non-blocking API calls
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def generate_module_questions(module_name: str, module_content: str, module_index: int) -> list[dict]:
    """
    Generate 1-2 multiple choice questions for a course module using Claude Sonnet

    Args:
        module_name: Name of the module
        module_content: Content/description of the module
        module_index: Index of the module in the course (0-based)

    Returns:
        List of question dicts with structure:
        {
            "module_index": int,
            "question_text": str,
            "options": [str, str, str, str],  # 4 options
            "correct_answer_index": int  # 0-3
        }
    """
    try:
        # Generate questions using Claude Sonnet
        message = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an educational assessment designer. Create multiple choice questions to test understanding of this course module.

Module Name: {module_name}
Module Content: {module_content}

Please create 1-2 multiple choice questions that test the most important concepts from this module.

RULES:
1. Create 1-2 questions (choose 1 for simpler modules, 2 for complex modules)
2. Each question should have exactly 4 answer options
3. Questions should test understanding, not just memorization
4. Make incorrect options plausible but clearly wrong to someone who understands the material
5. Focus on the most critical concepts only
6. Questions should be clear and unambiguous

Output your response as a JSON array of questions. Each question should have:
- "question_text": The question to ask
- "options": Array of exactly 4 answer options (strings)
- "correct_answer_index": Index (0-3) of the correct option

Example structure:
[
  {{
    "question_text": "What is the primary purpose of...",
    "options": [
      "Option A description",
      "Option B description",
      "Option C description",
      "Option D description"
    ],
    "correct_answer_index": 2
  }},
  {{
    "question_text": "Which statement best describes...",
    "options": [
      "First option",
      "Second option",
      "Third option",
      "Fourth option"
    ],
    "correct_answer_index": 0
  }}
]

IMPORTANT: Only output valid JSON. Do not include any text before or after the JSON array."""
                }
            ]
        )

        # Extract and parse JSON from response
        response_text = message.content[0].text.strip()

        # Remove markdown code fences if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            if lines[0].startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            response_text = '\n'.join(lines).strip()

        # Try to extract JSON if there's surrounding text
        if response_text.startswith('['):
            json_str = response_text
        else:
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
            else:
                print(f"❌ Could not find JSON in Claude response for module {module_name}")
                return []

        questions = json.loads(json_str)

        # Validate structure
        if not isinstance(questions, list):
            print(f"❌ Response is not a list for module {module_name}")
            return []

        if len(questions) < 1 or len(questions) > 2:
            print(f"⚠️ Expected 1-2 questions, got {len(questions)} for module {module_name}")
            # Don't return empty, just warn and continue with what we got

        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                print(f"❌ Invalid question structure at index {i} for module {module_name}")
                return []

            if 'question_text' not in question or 'options' not in question or 'correct_answer_index' not in question:
                print(f"❌ Missing required fields in question {i} for module {module_name}")
                return []

            if not isinstance(question['options'], list) or len(question['options']) != 4:
                print(f"❌ Question {i} must have exactly 4 options for module {module_name}")
                return []

            if not isinstance(question['correct_answer_index'], int) or question['correct_answer_index'] < 0 or question['correct_answer_index'] > 3:
                print(f"❌ Invalid correct_answer_index in question {i} for module {module_name}")
                return []

            # Add module_index to each question
            question['module_index'] = module_index

        print(f"✅ Generated {len(questions)} questions for module: {module_name}")
        return questions

    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON from Claude response for module {module_name}: {e}")
        return []
    except Exception as e:
        print(f"❌ Error generating questions for module {module_name}: {e}")
        return []


async def generate_all_course_questions(modules: list[dict]) -> list[dict]:
    """
    Generate questions for all modules in a course (in parallel)

    Args:
        modules: List of module dicts with 'name' and 'content' keys

    Returns:
        List of all questions across all modules
    """
    # Generate questions for all modules in parallel
    tasks = [
        generate_module_questions(module['name'], module['content'], index)
        for index, module in enumerate(modules)
    ]

    results = await asyncio.gather(*tasks)

    # Flatten the results
    all_questions = []
    for questions in results:
        all_questions.extend(questions)

    return all_questions
