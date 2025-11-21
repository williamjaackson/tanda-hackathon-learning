import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from anthropic import AsyncAnthropic
from pypdf import PdfReader
from io import BytesIO

# Use async client for non-blocking API calls
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Thread pool for CPU-bound PDF extraction
executor = ThreadPoolExecutor(max_workers=4)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes"""
    try:
        pdf_file = BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)

        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"

        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

async def summarize_pdf_with_claude(pdf_bytes: bytes, filename: str) -> str:
    """Extract text from PDF and generate summary using Claude (fully async)"""
    try:
        # Extract text from PDF in thread pool (CPU-bound operation)
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(executor, extract_text_from_pdf, pdf_bytes)

        if not text or len(text.strip()) < 10:
            return "Unable to extract text from PDF"

        # Limit text length for API call (roughly 100k tokens = ~400k chars)
        max_chars = 300000
        if len(text) > max_chars:
            text = text[:max_chars] + "\n\n[Text truncated due to length...]"

        # Generate summary using Claude (async, non-blocking)
        message = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""Please provide a comprehensive summary of this PDF document titled "{filename}".

Include:
1. Main topics and themes
2. Key points and important concepts
3. Overall purpose/conclusion

PDF Content:
{text}

Provide a clear, structured summary in 2-3 paragraphs."""
                }
            ]
        )

        # Extract summary from response
        summary = message.content[0].text
        return summary

    except Exception as e:
        return f"Error generating summary: {str(e)}"
