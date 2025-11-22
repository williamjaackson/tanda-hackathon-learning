import os
import json
from anthropic import AsyncAnthropic

# Use async client for non-blocking API calls
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def generate_course_modules(course_name: str, course_description: str, pdf_summaries: list[dict]) -> list[dict]:
    """
    Generate structured course modules from course description and PDF summaries
    using Claude Sonnet

    Args:
        course_name: Name of the course
        course_description: Description of the course
        pdf_summaries: List of dicts with 'filename' and 'summary' keys

    Returns:
        List of module dicts with 'name' and 'content' keys
    """
    try:
        # Build the context from PDF summaries
        pdf_context = "\n\n".join([
            f"PDF: {pdf['filename']}\nSummary: {pdf['summary']}"
            for pdf in pdf_summaries
            if pdf.get('summary')
        ])

        # If no PDFs, check if we have a course description to work with
        if not pdf_context and not course_description:
            print("❌ No PDFs or course description provided")
            return []

        # Generate modules using Claude Sonnet
        # Build appropriate prompt based on available materials
        if pdf_context:
            materials_section = f"""Course Materials:
{pdf_context}

Please analyze this content and create a learning plan with reasonably-sized modules in a logical linear progression."""
        else:
            materials_section = """No course materials provided yet. Please create a comprehensive learning plan based on the course name and description. Design modules that would typically be covered in this type of course, including foundational concepts, intermediate topics, and advanced applications."""

        message = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are a curriculum designer. Given a course and its materials, create a structured learning plan by organizing the content into logical modules/topics that build on each other.

Course Name: {course_name}
Course Description: {course_description or "Not provided"}

{materials_section}

RULES:
1. Create 4-8 modules that build on each other sequentially
2. Each module should have a clear, descriptive name and detailed content from the PDFs
3. Start with foundational concepts and progressively build to advanced topics
4. Each module naturally builds on the knowledge from the previous module
5. The sequence should form a clear learning path from basics to mastery

Output your response as a JSON array of modules. Each module should have:
- "name": A clear, descriptive module name
- "content": Detailed content combining relevant information from the PDFs, explaining key concepts

Example structure:
[
  {{
    "name": "Introduction to Fundamentals",
    "content": "This module introduces the basic concepts..."
  }},
  {{
    "name": "Building Core Skills",
    "content": "Building on the fundamentals from module 1, we now explore..."
  }},
  {{
    "name": "Advanced Applications",
    "content": "With a solid foundation in core skills, we can now tackle..."
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
            # Remove opening fence (```json or ```)
            lines = response_text.split('\n')
            if lines[0].startswith('```'):
                lines = lines[1:]
            # Remove closing fence
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            response_text = '\n'.join(lines).strip()

        # Try to extract JSON if there's surrounding text
        if response_text.startswith('['):
            json_str = response_text
        else:
            # Find JSON array in response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
            else:
                print(f"❌ Could not find JSON in Claude response")
                return []

        modules = json.loads(json_str)

        # Validate structure
        if not isinstance(modules, list):
            print(f"❌ Response is not a list")
            return []

        for i, module in enumerate(modules):
            if not isinstance(module, dict) or 'name' not in module or 'content' not in module:
                print(f"❌ Invalid module structure at index {i}")
                return []

        print(f"✅ Generated {len(modules)} course modules")
        return modules

    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON from Claude response: {e}")
        print(f"Response was: {response_text[:500]}...")
        return []
    except Exception as e:
        print(f"❌ Error generating course modules: {e}")
        return []
