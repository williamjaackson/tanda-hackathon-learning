import os
import asyncio
import tempfile
import shutil
from pathlib import Path
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def generate_manim_video(course_id: int, module_index: int, module_name: str, lesson_content: str) -> str:
    """
    Generate a manim video with audio narration using manim-voiceover plugin

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

        # Step 2: Generate manim code with voiceover plugin
        print(f"📝 Generating manim code with voiceover for module: {module_name}")
        manim_code = await generate_manim_code_with_voiceover(module_name, lesson_content, narration_script)

        # Step 3: Execute manim code (voiceover plugin handles audio generation and syncing)
        print(f"🎬 Rendering manim video with voiceover for module: {module_name}")
        video_path = await execute_manim_code(course_id, module_index, manim_code)

        # Step 4: Return the video URL (relative path for frontend)
        video_url = f"/videos/{course_id}/{module_index}.mp4"
        print(f"✅ Video with voiceover generated: {video_url}")

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
                "content": f"""You are an educational content creator. Write a clear, engaging narration script for a 40-50 second educational video.

Module: {module_name}
Content: {lesson_content}

Requirements:
1. Write in a friendly, conversational tone suitable for voice narration
2. Keep it concise - aim for 40-50 seconds when read aloud at normal speaking pace (approximately 120-150 words)
3. Break the narration into 3-5 logical segments/sentences that can be paired with visual animations
4. Start with a hook to grab attention
5. Explain the concept clearly and simply
6. Use short sentences that flow well when spoken
7. End with a key takeaway or summary
8. Avoid complex jargon - use accessible language
9. Make it engaging and memorable

IMPORTANT: Only output the narration script text - no additional formatting, labels, or explanations.

Example format:
"Welcome! Today we're exploring [topic]. [Main explanation in 2-3 sentences]. Here's why this matters: [impact/application]. Remember: [key takeaway]."

Generate the narration script now (120-150 words for 40-50 seconds):"""
            }
        ]
    )

    return message.content[0].text.strip()


async def generate_manim_code_with_voiceover(module_name: str, lesson_content: str, narration_script: str) -> str:
    """
    Use Claude AI to generate manim Python code using manim-voiceover plugin
    """
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": f"""You are an expert at creating educational videos using Manim (Mathematical Animation Engine) with the manim-voiceover plugin.

Generate a Manim scene that teaches the following concept with synchronized voiceover:

Module: {module_name}
Content: {lesson_content}

Narration Script (this will be the voiceover):
"{narration_script}"

Requirements:
1. Create a class called "LessonScene" that inherits from VoiceoverScene (not Scene!)
2. Import: from manim_voiceover import VoiceoverScene
3. Import: from manim_voiceover.services.gtts import GTTSService
4. In construct(), FIRST set: self.camera.background_color = WHITE (white background!)
5. In construct(), call: self.set_speech_service(GTTSService())
6. Use self.voiceover(text="...") as tracker: blocks to add voiceovers
7. CRITICAL: Every voiceover block MUST have non-empty text. Never use text="" or empty strings!
8. Sync animations using tracker.duration: self.play(Animation, run_time=tracker.duration)
9. Break the narration into multiple voiceover blocks for better pacing
10. Use clear, readable text (font size 36 or larger)
11. Use colors that work well on white background (BLACK for text, BLUE, GREEN, RED, ORANGE for highlights)
12. Include a title at the start
13. Use manim's built-in animations like Write, FadeIn, FadeOut, Transform, Create, etc.
14. For visual-only animations without narration, use self.play() without voiceover context manager

IMPORTANT: Only output valid Python code using Manim Community Edition with manim-voiceover.
Do not include any explanations or markdown formatting - only the Python code.

Example structure:
```python
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

class LessonScene(VoiceoverScene):
    def construct(self):
        # IMPORTANT: Set white background first!
        self.camera.background_color = WHITE
        self.set_speech_service(GTTSService())

        # Title with voiceover (use BLACK or dark colors for text on white background)
        with self.voiceover(text="Welcome! Today we're exploring {module_name}.") as tracker:
            title = Text("{module_name}", font_size=48, color=BLACK)
            self.play(Write(title), run_time=tracker.duration)

        self.play(FadeOut(title))

        # Main content with synchronized voiceovers
        with self.voiceover(text="First key concept...") as tracker:
            text1 = Text("Concept 1", font_size=36, color=BLACK)
            self.play(FadeIn(text1), run_time=tracker.duration)

        # For animations without narration, use self.play() directly
        self.play(FadeOut(text1))

        # More voiceover blocks with non-empty text
        with self.voiceover(text="Let me explain further...") as tracker:
            text2 = Text("More details", font_size=36, color=BLACK)
            self.play(Write(text2), run_time=tracker.duration)
```

Now generate the complete Manim code with voiceover:"""
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


async def execute_manim_code(course_id: int, module_index: int, manim_code: str) -> str:
    """
    Execute manim code with voiceover plugin (audio generation and syncing handled by plugin)
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

        # Execute manim with voiceover to render video (async subprocess)
        print(f"🎬 Running manim renderer with voiceover...")
        try:
            process = await asyncio.create_subprocess_exec(
                "manim",
                "-ql",  # Low quality for faster rendering
                "--format=mp4",
                "--media_dir",
                str(temp_path / "media"),
                str(scene_file),
                "LessonScene",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=temp_dir
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=300)

            if process.returncode != 0:
                error_msg = f"Manim rendering failed:\nSTDOUT: {stdout.decode()}\nSTDERR: {stderr.decode()}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)

            print(f"✅ Manim rendering with voiceover completed successfully")
        except asyncio.TimeoutError:
            raise Exception("Manim rendering timed out after 5 minutes")

        # Find the generated video file (with audio already embedded by manim-voiceover)
        media_path = temp_path / "media" / "videos" / "scene" / "480p15"
        if not media_path.exists():
            raise Exception(f"Media path does not exist: {media_path}")

        video_files = list(media_path.glob("*.mp4"))

        if not video_files:
            raise Exception(f"No video file generated by manim in {media_path}")

        generated_video = video_files[0]
        print(f"📹 Found generated video with voiceover: {generated_video}")

        # Create destination directory
        video_dir = Path("static/videos") / str(course_id)
        video_dir.mkdir(parents=True, exist_ok=True)

        # Crop the video to remove 1px black border using ffmpeg
        final_video = video_dir / f"{module_index}.mp4"
        print(f"✂️ Cropping video to remove black border...")

        crop_process = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-i", str(generated_video),
            "-vf", "crop=iw-3:ih-2:2:1",  # Crop 2px from left, 1px from right/top/bottom
            "-c:a", "copy",  # Copy audio without re-encoding
            "-y",  # Overwrite output file
            str(final_video),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await crop_process.communicate()

        if crop_process.returncode != 0:
            print(f"⚠️ FFmpeg crop failed, falling back to uncropped video: {stderr.decode()}")
            shutil.copy2(generated_video, final_video)

        # Verify final video exists
        if not final_video.exists():
            raise Exception(f"Final video was not created at {final_video}")

        print(f"✅ Video with voiceover complete: {final_video}")

        return str(final_video)

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
