import os
import asyncio
import subprocess
import tempfile
import shutil
from pathlib import Path
from anthropic import AsyncAnthropic
from gtts import gTTS

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def generate_manim_video(course_id: int, module_index: int, module_name: str, lesson_content: str) -> str:
    """
    Generate a manim video with audio narration for a module lesson using Claude AI

    Args:
        course_id: ID of the course
        module_index: Index of the module
        module_name: Name of the module
        lesson_content: Content of the lesson

    Returns:
        URL path to the generated video
    """
    try:
        # Step 1: Generate narration script using Claude
        print(f"🗣️ Generating narration script for module: {module_name}")
        narration_script = await generate_narration_script(module_name, lesson_content)

        # Step 2: Generate manim code with voiceover using Claude
        print(f"📝 Generating manim code for module: {module_name}")
        manim_code = await generate_manim_code_with_audio(module_name, lesson_content, narration_script)

        # Step 3: Generate audio file from narration
        print(f"🔊 Generating audio narration for module: {module_name}")
        audio_path = await generate_audio(narration_script)

        # Step 4: Execute manim code to generate video with audio
        print(f"🎬 Rendering manim video for module: {module_name}")
        video_path = await execute_manim_code(course_id, module_index, manim_code, audio_path)

        # Step 5: Return the video URL (relative path for frontend)
        video_url = f"/videos/{course_id}/{module_index}.mp4"
        print(f"✅ Video with audio generated: {video_url}")

        return video_url

    except Exception as e:
        print(f"❌ Failed to generate manim video: {e}")
        raise


async def generate_narration_script(module_name: str, lesson_content: str) -> str:
    """
    Generate a narration script for the lesson using Claude AI
    """
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": f"""You are an educational content creator. Write a clear, engaging narration script for a 30-60 second educational video.

Module: {module_name}
Content: {lesson_content}

Requirements:
1. Write in a friendly, conversational tone suitable for voice narration
2. Keep it concise (30-60 seconds when read aloud at normal pace)
3. Start with a hook to grab attention
4. Explain the concept clearly and simply
5. Use short sentences that flow well when spoken
6. End with a key takeaway or summary
7. Avoid complex jargon - use accessible language
8. Make it engaging and memorable

IMPORTANT: Only output the narration script text - no additional formatting, labels, or explanations.

Example format:
"Welcome! Today we're exploring [topic]. [Main explanation in 2-3 sentences]. Here's why this matters: [impact/application]. Remember: [key takeaway]."

Generate the narration script now:"""
            }
        ]
    )

    return message.content[0].text.strip()


async def generate_audio(narration_script: str) -> str:
    """
    Generate audio file from narration script using Google Text-to-Speech
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as audio_file:
            audio_path = audio_file.name

        # Generate audio using gTTS (synchronous, so run in executor)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: _generate_audio_sync(narration_script, audio_path))

        if not os.path.exists(audio_path):
            raise Exception("Audio file was not created")

        return audio_path
    except Exception as e:
        raise Exception(f"Failed to generate audio: {str(e)}")


def _generate_audio_sync(text: str, output_path: str):
    """Synchronous helper for gTTS"""
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(output_path)


async def generate_manim_code_with_audio(module_name: str, lesson_content: str, narration_script: str) -> str:
    """
    Use Claude AI to generate manim Python code for the lesson with audio sync
    """
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": f"""You are an expert at creating educational videos using Manim (Mathematical Animation Engine).

Generate a Manim scene that teaches the following concept with synchronized visuals:

Module: {module_name}
Content: {lesson_content}

Narration Script (this will be the audio):
"{narration_script}"

Requirements:
1. Create a single Scene class called "LessonScene" that inherits from Scene
2. The video should be 30-60 seconds long (matching the narration length)
3. Use clear, readable text (font size 36 or larger)
4. Time your animations to sync with the narration script
5. Use colors to highlight important concepts (WHITE, BLUE, GREEN, RED, YELLOW)
6. Break down complex ideas into simple, visual steps that complement the narration
7. Include a title at the start
8. Use manim's built-in animations like Write, FadeIn, FadeOut, Transform, Create, etc.
9. Use self.wait() strategically to pace animations with the expected narration timing

IMPORTANT: Only output valid Python code using Manim Community Edition (manim library).
Do not include any explanations or markdown formatting - only the Python code.

Example structure:
```python
from manim import *

class LessonScene(Scene):
    def construct(self):
        # Title (sync with opening)
        title = Text("{module_name}", font_size=48)
        self.play(Write(title))
        self.wait(2)
        self.play(FadeOut(title))

        # Main content with animations timed to narration
        # ... your code here ...

        # Use self.wait() to match narration pauses
        self.wait(1)
```

Now generate the complete Manim code:"""
            }
        ]
    )

    # Extract code from response
    code = message.content[0].text.strip()

    # Remove markdown code fences if present
    if code.startswith('```'):
        lines = code.split('\n')
        if lines[0].startswith('```'):
            lines = lines[1:]
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        code = '\n'.join(lines).strip()

    return code


async def execute_manim_code(course_id: int, module_index: int, manim_code: str, audio_path: str) -> str:
    """
    Execute manim code and merge with audio to create final video
    """
    temp_dir = None
    try:
        # Create temp directory for manim execution
        temp_dir = tempfile.mkdtemp()
        temp_path = Path(temp_dir)
        scene_file = temp_path / "scene.py"

        # Write manim code to file
        print(f"📄 Writing manim scene to {scene_file}")
        scene_file.write_text(manim_code)

        # Execute manim to render video (without audio first)
        print(f"🎬 Running manim renderer...")
        result = subprocess.run(
            [
                "manim",
                "-ql",  # Low quality for faster rendering
                "--format=mp4",
                "--media_dir",
                str(temp_path / "media"),
                str(scene_file),
                "LessonScene"
            ],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=temp_dir
        )

        if result.returncode != 0:
            error_msg = f"Manim rendering failed:\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)

        print(f"✅ Manim rendering completed successfully")

        # Find the generated video file
        media_path = temp_path / "media" / "videos" / "scene" / "480p15"
        if not media_path.exists():
            raise Exception(f"Media path does not exist: {media_path}")

        video_files = list(media_path.glob("*.mp4"))

        if not video_files:
            raise Exception(f"No video file generated by manim in {media_path}")

        generated_video = video_files[0]
        print(f"📹 Found generated video: {generated_video}")

        # Create destination directory
        video_dir = Path("static/videos") / str(course_id)
        video_dir.mkdir(parents=True, exist_ok=True)

        # Output video with audio
        final_video = video_dir / f"{module_index}.mp4"

        # Merge video and audio using ffmpeg
        print(f"🔊 Merging video with audio narration...")
        merge_result = subprocess.run(
            [
                "ffmpeg",
                "-i", str(generated_video),  # Video input
                "-i", audio_path,  # Audio input
                "-c:v", "copy",  # Copy video codec (no re-encoding)
                "-c:a", "aac",  # Encode audio to AAC
                "-shortest",  # Stop when shortest input ends
                "-y",  # Overwrite output file
                str(final_video)
            ],
            capture_output=True,
            text=True,
            timeout=60
        )

        if merge_result.returncode != 0:
            print(f"⚠️ FFmpeg merge failed: {merge_result.stderr}")
            # If merge fails, just copy video without audio as fallback
            print(f"⚠️ Using video without audio as fallback")
            shutil.copy2(generated_video, final_video)
        else:
            print(f"✅ Successfully merged video with audio")

        # Verify final video exists
        if not final_video.exists():
            raise Exception(f"Final video was not created at {final_video}")

        print(f"✅ Video generation complete: {final_video}")

        # Clean up temporary audio file
        try:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
                print(f"🗑️ Cleaned up temporary audio file")
        except Exception as e:
            print(f"⚠️ Could not clean up audio file: {e}")

        return str(final_video)

    except subprocess.TimeoutExpired as e:
        error_msg = f"Manim rendering timed out after 5 minutes"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to execute manim: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    finally:
        # Clean up temp directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f"🗑️ Cleaned up temporary directory")
            except Exception as e:
                print(f"⚠️ Could not clean up temp directory: {e}")
