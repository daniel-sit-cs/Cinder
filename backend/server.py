import os
import uuid
import time
from typing import List, Optional
from datetime import timedelta
from huggingface_hub import InferenceClient
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from moviepy.editor import ImageClip, CompositeVideoClip, AudioFileClip
from gtts import gTTS
import firebase_admin
from firebase_admin import credentials, storage

# ============================================================================
# CONFIGURATION
# ============================================================================
HF_TOKEN = ""
client = InferenceClient(token=HF_TOKEN)

cred = credentials.Certificate("firebase-key.json")
# Check if app is already initialized to prevent reload errors
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'cinder-9012f.firebasestorage.app' 
    })

def upload_to_firebase(local_file_path, storage_path):
    print(f"   ... Uploading {storage_path} to Firebase Cloud Storage")
    bucket = storage.bucket()
    blob = bucket.blob(storage_path)
    blob.upload_from_filename(local_file_path)
    # Generate a public URL that lasts for 7 days
    url = blob.generate_signed_url(version="v4", expiration=timedelta(days=7), method="GET")
    return url

# ============================================================================
# Data Models
# ============================================================================
class GenerateStoryRequest(BaseModel):
    userId: str
    prompt: str
    style: Optional[str] = "storybook"
    frameCount: int = 4
    referenceImage: Optional[str] = None 

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
# ENGINES
# ============================================================================

def create_cinematic_video(image_path, text, output_path):
    """
    Restored Function: Converts an image + text into a zoomed video with audio.
    """
    try:
        print("   ... Generating Audio (Google TTS)")
        audio_path = output_path.replace(".mp4", ".mp3")
        
        # 1. Generate Audio
        tts = gTTS(text=text, lang='en')
        tts.save(audio_path)
        
        audio_clip = AudioFileClip(audio_path)
        duration = audio_clip.duration + 0.5 

        print("   ... Rendering Video Zoom")
        # 2. create Image Clip
        clip = ImageClip(image_path).set_duration(duration)
        w, h = clip.size
        
        # 3. Apply Ken Burns (Zoom) Effect
        zoomed_clip = clip.resize(lambda t: 1 + 0.025 * t).set_position(('center', 'center'))
        final_clip = CompositeVideoClip([zoomed_clip], size=(w, h))

        # 4. Combine Audio and Video
        final_clip = final_clip.set_audio(audio_clip)
        
        # 5. Write File
        final_clip.write_videofile(
            output_path, 
            fps=24, 
            codec="libx264", 
            preset="ultrafast", 
            audio_codec="aac"
        )
        
        # Cleanup audio resource
        try:
            audio_clip.close()
        except:
            pass
            
        return True
    except Exception as e:
        print(f"❌ Video Engine Error: {e}")
        return False

def generate_real_story(prompt: str, frame_count: int, style: str, ref_image: Optional[str] = None) -> List[Frame]:
    print(f"🚀 CLOUD MODE: Sending to Hugging Face for prompt: '{prompt}'")
    frames = []

    story_beats = [
        ("establishing wide shot of {prompt}, peaceful beginning", "Our story begins with {prompt}, where a grand adventure awaits."),
        ("action shot of {prompt} packing gear and setting off", "With bags packed and eyes on the horizon, the journey officially began."),
        ("dramatic shot of {prompt} encountering a massive storm or obstacle", "But the path was not easy. A sudden, massive obstacle blocked the way!"),
        ("mysterious shot of {prompt} discovering an uncharted island or land", "Through the chaos, a mysterious, uncharted territory appeared."),
        ("detailed shot of {prompt} exploring the strange new environment", "Venturing deeper into the unknown, strange sights and wonders were everywhere."),
        ("shot of {prompt} meeting a quirky but helpful ally", "Along the way, an unexpected but welcome ally joined the cause."),
        ("dark, shadowy shot hinting at a lurking villain observing {prompt}", "Unbeknownst to them, a dark presence was watching from the shadows."),
        ("intense action shot of {prompt} being ambushed by enemies", "Without warning, a fierce ambush struck!"),
        ("struggling shot of {prompt} being pushed to their limits, dramatic lighting", "The enemies were overwhelmingly strong, pushing our hero to their absolute limits."),
        ("heroic glowing shot of {prompt} finding new resolve and standing back up", "But giving up wasn't an option. A fierce new resolve ignited within!"),
        ("epic clash action shot, {prompt} fighting back with incredible power", "With a mighty roar, the counterattack began, shaking the very ground."),
        ("climax shot of {prompt} delivering a massive, glowing finishing blow", "In a flash of brilliant light, the final, decisive blow was struck!"),
        ("relieved shot of {prompt} standing victorious as the dust settles", "As the dust finally settled, victory was secured."),
        ("warm, happy shot of {prompt} celebrating with food and allies", "The night was filled with joyous celebration, food, and laughter."),
        ("beautiful sunset shot of {prompt} looking towards the next horizon", "And so, with one chapter closed, eyes turned toward the next great adventure.")
    ]

    try:
        for i in range(frame_count):
            print(f"   ... Generating Frame {i+1}/{frame_count}")
            beat_idx = min(i, len(story_beats) - 1)
            scene_template, narration_template = story_beats[beat_idx]
            
            base_prompt = scene_template.format(prompt=prompt)
            
            # Massive Luffy Prompt Injection
            character_description = "Monkey D. Luffy is a young adult male pirate captain with a lean yet densely muscular, compact athletic build approximately 174 cm tall, lightly tanned skin marked by minor battle scuffs and a large X-shaped scar across his chest, along with a small stitched diagonal scar under his left eye, his face rounded but defined with a soft jawline, slightly pointed chin, wide expressive black eyes with intense innocent energy, thin arched eyebrows, a small rounded nose, and a default fearless full-toothed grin that can instantly shift into razor-sharp focus; his jet black hair is messy, medium length, uneven and windswept with irregular spikes pointing outward naturally without precise grooming, often moving freely in the wind beneath his iconic straw hat made of woven tan straw fibers with a red fabric band, slightly worn curved brim, and a thin chin strap, usually tilted back when serious; he wears an open sleeveless red vest with three small yellow buttons, sun-faded and loose to allow unrestricted movement, blue knee-length shorts with rolled slightly frayed cuffs, a simple yellow sash at the waist, and worn brown sandals with rope or leather straps; his physique is wiry yet powerful with visible abdominal and shoulder definition, veins surfacing during exertion, and a body capable of unnatural rubber-like elasticity where limbs stretch, compress, and rebound fluidly, joints extending beyond normal anatomy while maintaining structural control; his stance alternates between loose and spring-loaded, often crouched low like a coiled animal ready to launch, movements unpredictable and elastic rather than rigid; when activating Gear Second his skin flushes slightly pink as steam vents from his body with heightened vascular definition and heat distortion, in Gear Third a single limb inflates massively with taut smooth skin emphasizing blunt overwhelming force, in Gear Fourth Boundman his upper body becomes barrel-like and massively muscular with arms and legs coated in glossy jet black Armament Haki, white steam swirling around him, subtle hovering due to compressed elasticity, red shading around the eyes and flame-like Haki patterns across the torso, and in Gear Fifth his hair turns pure white and fluffy with curled spiral eyebrows, bright glowing eyes, white smoke aura radiating from his body as both clothing and form lighten in tone, movements exaggerated in cartoon-like rubberhose physics with reality itself subtly bending elastically in response to his actions, his demeanor wildly joyful and unrestrained; when using Armament Haki his limbs gain a hard metallic black sheen often crackling with dark lightning at high intensity, Observation Haki sharpens his gaze with an almost imperceptible ripple of awareness, and Conqueror’s Haki manifests as explosive black lightning arcs and atmospheric pressure distortion that fractures the environment visually; overall his presence radiates chaotic freedom, reckless confidence, childlike joy fused with indomitable willpower, a natural charismatic gravity that inspires allies and intimidates enemies, smiling in the face of overwhelming danger yet capable of becoming terrifyingly calm and focused, embodying elastic unpredictability, absolute conviction, and the unstoppable spirit of a pirate who treats battle as spectacle and freedom as sacred."
            
            scene_prompt = f"{style} style, {character_description} {base_prompt}"
            
            # Character Consistency Logic (Append reference note if image provided)
            if ref_image:
                scene_prompt = f"Consistent character from reference, {scene_prompt}"
                
            narration_text = narration_template.format(prompt=prompt.split(',')[0])

            image = client.text_to_image(prompt=scene_prompt, model="stabilityai/stable-diffusion-xl-base-1.0")
            
            img_filename = f"frame_{uuid.uuid4().hex[:8]}.png"
            img_path = os.path.join("generated_videos", img_filename)
            image.save(img_path)
            
            firebase_url = upload_to_firebase(img_path, f"images/{img_filename}")
            frames.append(Frame(index=i, narration=narration_text, imageUrl=firebase_url))
            time.sleep(1.0) 

        return frames
    except Exception as e:
        print(f"❌ HF Error: {e}")
        raise HTTPException(status_code=500, detail=f"Hugging Face API Error: {str(e)}")

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
        frames = generate_real_story(request.prompt, request.frameCount, request.style, request.referenceImage)
        return GenerateStoryResponse(status="success", storyId=story_id, frames=frames)
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/animate-frame")
async def animate_frame(request: AnimateRequest):
    try:
        filename = request.imageUrl.split("/")[-1].split("?")[0]
        existing_img_path = os.path.join("generated_videos", filename)
        video_name = f"video_{uuid.uuid4().hex[:8]}.mp4"
        video_path = os.path.join("generated_videos", video_name)
        
        # ✅ NOW THIS FUNCTION EXISTS!
        success = create_cinematic_video(existing_img_path, request.narration, video_path)
        if not success: raise Exception("Rendering failed")
        
        firebase_video_url = upload_to_firebase(video_path, f"videos/{video_name}")
        return {"status": "success", "videoPath": firebase_video_url, "filename": video_name}
    except Exception as e:
        print(f"❌ Animation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)