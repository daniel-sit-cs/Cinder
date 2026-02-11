"""
Cinder Backend API - Ultimate Hybrid
- Cloud Images (Hugging Face)
- Local Video (MoviePy)
- Cloud Audio (Google TTS) - Python 3.12 Compatible
"""
import os
import uuid
import base64
from io import BytesIO
from typing import List, Optional

# 1. Imports
from huggingface_hub import InferenceClient
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from PIL import Image

# 2. Media Engines
# Using the standard MoviePy 1.0.3 import style
from moviepy.editor import ImageClip, CompositeVideoClip, AudioFileClip
from gtts import gTTS 

# ============================================================================
# CONFIGURATION
# ============================================================================

MOCK_MODE = False 
from dotenv import load_dotenv
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
client = InferenceClient(token=HF_TOKEN)

# ============================================================================
# Data Models
# ============================================================================

class GenerateStoryRequest(BaseModel):
    userId: str   
    prompt: str   
    style: Optional[str] = "storybook" 
    frameCount: int = 4 

class AnimateRequest(BaseModel):
    imageUrl: str 
    narration: str 

class Frame(BaseModel):
    index: int
    narration: str 
    imageUrl: str 

class GenerateStoryResponse(BaseModel):
    status: str
    storyId: str
    frames: List[Frame]

# ============================================================================
# Helper Functions
# ============================================================================

def pil_image_to_base64(image) -> str:
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def base64_to_pil(base64_string):
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(BytesIO(image_data))

# ============================================================================
# ENGINES
# ============================================================================

def generate_real_story(prompt: str, frame_count: int, style: str) -> List[Frame]:
    print(f"🚀 CLOUD MODE: Sending to Hugging Face for prompt: '{prompt}'")
    frames = []

    try:
        for i in range(frame_count):
            print(f"   ... Generating Frame {i+1}/{frame_count}")
            
            # Narrative Logic
            if i == 0:
                scene_prompt = f"{style} style, establishing shot of {prompt}, highly detailed"
                narration_text = f"Our story begins with {prompt}, where adventure awaits."
            elif i == 1:
                scene_prompt = f"{style} style, action shot of {prompt} exploring, dynamic lighting"
                narration_text = "Venturing deeper into the unknown, secrets began to unravel."
            elif i == 2:
                scene_prompt = f"{style} style, climax discovery of {prompt}, glowing magical object"
                narration_text = "Suddenly, a breathtaking discovery changed everything!"
            else:
                scene_prompt = f"{style} style, peaceful ending scene of {prompt}, warm colors"
                narration_text = "And so, the journey came to a peaceful end, leaving memories forever."

            image = client.text_to_image(prompt=scene_prompt, model="stabilityai/stable-diffusion-xl-base-1.0")
            
            frames.append(Frame(
                index=i,
                narration=narration_text,
                imageUrl=pil_image_to_base64(image)
            ))

        return frames

    except Exception as e:
        print(f"❌ HF Error: {e}")
        raise HTTPException(status_code=500, detail=f"Hugging Face API Error: {str(e)}")

def create_cinematic_video(image_path, text, output_path):
    """Generates Video + Audio (Google TTS)"""
    try:
        # 1. Generate Audio (Google TTS)
        print("   ... Generating Audio (Google TTS)")
        audio_path = output_path.replace(".mp4", ".mp3")
        
        tts = gTTS(text=text, lang='en')
        tts.save(audio_path)
        
        # Load audio to get duration
        audio_clip = AudioFileClip(audio_path)
        duration = audio_clip.duration + 0.5 # Add 0.5s buffer

        # 2. Create Zoom Video
        print("   ... Rendering Video Zoom")
        clip = ImageClip(image_path).set_duration(duration)
        w, h = clip.size
        
        # Zoom effect: 1.0 -> 1.10
        zoomed_clip = clip.resize(lambda t: 1 + 0.025 * t).set_position(('center', 'center'))
        final_clip = CompositeVideoClip([zoomed_clip], size=(w, h))

        # 3. Attach Audio
        final_clip = final_clip.set_audio(audio_clip)
        
        # 4. Write File
        final_clip.write_videofile(
            output_path, 
            fps=24, 
            codec="libx264", 
            preset="ultrafast", 
            audio_codec="aac"
        )
        
        # Cleanup audio temp file
        try:
            audio_clip.close()
        except:
            pass
            
        return True
    except Exception as e:
        print(f"❌ Video Engine Error: {e}")
        return False

# ============================================================================
# API ROUTES
# ============================================================================

app = FastAPI(title="Cinder Backend API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

os.makedirs("generated_videos", exist_ok=True)
app.mount("/videos", StaticFiles(directory="generated_videos"), name="videos")

@app.post("/generate-story", response_model=GenerateStoryResponse)
async def generate_story(request: GenerateStoryRequest):
    try:
        story_id = f"{request.userId}_{uuid.uuid4().hex[:8]}"
        frames = generate_real_story(request.prompt, request.frameCount, request.style)
        return GenerateStoryResponse(status="success", storyId=story_id, frames=frames)
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/animate-frame")
async def animate_frame(request: AnimateRequest):
    print(f"🎬 Animating: {request.narration[:20]}...")
    try:
        image = base64_to_pil(request.imageUrl)
        temp_img_path = os.path.join("generated_videos", f"temp_{uuid.uuid4().hex[:6]}.png")
        image.save(temp_img_path)
        
        video_name = f"video_{uuid.uuid4().hex[:8]}.mp4"
        video_path = os.path.join("generated_videos", video_name)
        
        success = create_cinematic_video(temp_img_path, request.narration, video_path)
        if not success: raise Exception("Rendering failed")

        return {"status": "success", "videoPath": video_path, "filename": video_name}
    except Exception as e:
        print(f"❌ Animation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("✨ CINDER SERVER STARTING... (GOOGLE TTS + VIDEO)")
    uvicorn.run(app, host="0.0.0.0", port=8000)