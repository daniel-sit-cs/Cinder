"""
Cinder Backend — Story-Iter/NAVIS Edition
==========================================
Runs on Google Colab (Pro) with an A100 GPU.
Uses StoryAdapterXL (Story-Iter iterative refinement) instead of Replicate API.

API shape is identical to server.py — the mobile app doesn't need any changes
beyond updating the API_URL in storyService.ts to the ngrok tunnel URL.

Setup:
  See backend/cinder_colab.ipynb for the full Colab setup notebook.
"""

import os
import sys
import io
import uuid
import base64
import requests
import threading
import numpy as np
from typing import List, Optional, Dict, Any
from datetime import timedelta
from dotenv import load_dotenv
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from moviepy.editor import ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
from gtts import gTTS
import firebase_admin
from firebase_admin import credentials, storage

# Story-Iter imports — path is set by the Colab notebook before starting this server
from ip_adapter import StoryAdapterXL
from diffusers import StableDiffusionXLPipeline, DDIMScheduler
import torch

# ============================================================================
# CONFIGURATION
# ============================================================================
load_dotenv()

# Model checkpoint paths (set by Colab notebook environment, with defaults)
BASE_MODEL_PATH    = os.getenv("BASE_MODEL_PATH",    "ckpt/story-ad/RealVisXL_V4")
IMAGE_ENCODER_PATH = os.getenv("IMAGE_ENCODER_PATH", "ckpt/ipa/sdxl_models/image_encoder")
IP_CKPT            = os.getenv("IP_CKPT",            "ckpt/ipa/sdxl_models/ip-adapter_sdxl.bin")
DEVICE             = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🔧 Device: {DEVICE}")
print(f"🔧 Base model: {BASE_MODEL_PATH}")

# ---- Firebase ----
cred = credentials.Certificate("firebase-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'cinder-9012f.firebasestorage.app'
    })

# ---- Load Story-Iter models (once at startup) ----
print("⏳ Loading Story-Iter models (this takes ~2-3 min)...")

noise_scheduler = DDIMScheduler(
    num_train_timesteps=1000,
    beta_start=0.00085,
    beta_end=0.012,
    beta_schedule="scaled_linear",
    clip_sample=False,
    set_alpha_to_one=False,
    steps_offset=1,
)

pipe = StableDiffusionXLPipeline.from_pretrained(
    BASE_MODEL_PATH,
    torch_dtype=torch.float16,
    scheduler=noise_scheduler,
    feature_extractor=None,
    safety_checker=None,
)

storyadapter = StoryAdapterXL(pipe, IMAGE_ENCODER_PATH, IP_CKPT, DEVICE)
print("✅ Story-Iter models loaded.")

# ============================================================================
# STORY BEATS (unchanged from server.py)
# ============================================================================
STORY_BEATS = [
    ("establishing wide shot of {prompt}, peaceful beginning",
     "Our story begins with {prompt}, where a grand adventure awaits."),
    ("action shot of {prompt} packing gear and setting off",
     "With bags packed and eyes on the horizon, the journey officially began."),
    ("dramatic shot of {prompt} encountering a massive storm or obstacle",
     "But the path was not easy. A sudden, massive obstacle blocked the way!"),
    ("mysterious shot of {prompt} discovering an uncharted island or land",
     "Through the chaos, a mysterious, uncharted territory appeared."),
    ("detailed shot of {prompt} exploring the strange new environment",
     "Venturing deeper into the unknown, strange sights and wonders were everywhere."),
    ("shot of {prompt} meeting a quirky but helpful ally",
     "Along the way, an unexpected but welcome ally joined the cause."),
    ("dark, shadowy shot hinting at a lurking villain observing {prompt}",
     "Unbeknownst to them, a dark presence was watching from the shadows."),
    ("intense action shot of {prompt} being ambushed by enemies",
     "Without warning, a fierce ambush struck!"),
    ("struggling shot of {prompt} being pushed to their limits, dramatic lighting",
     "The enemies were overwhelmingly strong, pushing our hero to their absolute limits."),
    ("heroic glowing shot of {prompt} finding new resolve and standing back up",
     "But giving up wasn't an option. A fierce new resolve ignited within!"),
    ("epic clash action shot, {prompt} fighting back with incredible power",
     "With a mighty roar, the counterattack began, shaking the very ground."),
    ("climax shot of {prompt} delivering a massive, glowing finishing blow",
     "In a flash of brilliant light, the final, decisive blow was struck!"),
    ("relieved shot of {prompt} standing victorious as the dust settles",
     "As the dust finally settled, victory was secured."),
    ("warm, happy shot of {prompt} celebrating with food and allies",
     "The night was filled with joyous celebration, food, and laughter."),
    ("beautiful sunset shot of {prompt} looking towards the next horizon",
     "And so, with one chapter closed, eyes turned toward the next great adventure."),
]

# ============================================================================
# DATA MODELS (identical to server.py)
# ============================================================================
class GenerateStoryRequest(BaseModel):
    userId: str
    prompt: str
    style: Optional[str] = "storybook"
    frameCount: int = 15
    referenceImage: Optional[str] = None  # base64 encoded PNG/JPEG

class Frame(BaseModel):
    index: int
    narration: str
    imageUrl: str

class GenerateStoryResponse(BaseModel):
    status: str
    storyId: str
    frames: List[Frame]
    videoUrl: Optional[str] = None

# ============================================================================
# FIREBASE UPLOAD (unchanged from server.py)
# ============================================================================
def upload_to_firebase(local_file_path: str, storage_path: str) -> str:
    print(f"   ... Uploading {storage_path} to Firebase")
    bucket = storage.bucket()
    blob = bucket.blob(storage_path)
    blob.upload_from_filename(local_file_path)
    return blob.generate_signed_url(version="v4", expiration=timedelta(days=7), method="GET")

# ============================================================================
# IMAGE GENERATION via Story-Iter (StoryAdapterXL)
#
# Pipeline:
#   Pass 0  — text-only generation (or character-seeded if referenceImage provided)
#   Pass 1-3 — iterative refinement using accumulated thumbnail context
#   Pass 4  — final full-resolution output to disk
#
# Professor's requirement: character image is OPTIONAL.
#   Without referenceImage: pure text-driven story generation
#   With    referenceImage: character face seeds Pass 0, then refinement locks it in
# ============================================================================
def generate_images_via_story_iter(
    prompt: str,
    frame_count: int,
    style: str,
    ref_image_b64: Optional[str] = None,
) -> List[tuple]:
    """
    Returns a list of (local_image_path, narration_text) tuples.
    Uses StoryAdapterXL iterative refinement for semantic consistency.
    """
    beats = STORY_BEATS[:frame_count]
    prompts    = [b[0].format(prompt=prompt) for b in beats]
    narrations = [b[1].format(prompt=prompt.split(',')[0]) for b in beats]

    # Decode optional character reference image
    character_image = None
    if ref_image_b64:
        img_bytes = base64.b64decode(ref_image_b64)
        character_image = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((256, 256))
        print(f"🎭 Character reference image provided — seeding Pass 0 with character.")
    else:
        print(f"📝 No reference image — generating from text prompts only.")

    print(f"🎨 Story-Iter: {frame_count} frames, style='{style}', device={DEVICE}")

    # ------------------------------------------------------------------
    # Pass 0: Initial generation
    #   - With character image → use it as the IP-Adapter reference
    #   - Without             → text-only (use_image=False)
    # ------------------------------------------------------------------
    print(f"[Pass 0] Initial generation ({frame_count} frames)...")
    thumbnails = []
    use_character = character_image is not None

    for i, text in enumerate(prompts):
        print(f"   Frame {i+1}/{frame_count}")
        result = storyadapter.generate(
            pil_image=[character_image] if use_character else None,
            use_image=use_character,
            prompt=text,
            scale=0.3,
            num_samples=1,
            num_inference_steps=20,
            seed=42,
            style=style,
        )
        thumbnails.append(result[0].resize((256, 256)))

    # ------------------------------------------------------------------
    # Passes 1-3: Iterative refinement
    #   Each pass uses ALL previous-iteration thumbnails as visual context,
    #   progressively increasing the IP-Adapter scale (0.3 → 0.5).
    #   This is the core of Story-Iter: GRCA cross-attention across frames.
    # ------------------------------------------------------------------
    scales = np.linspace(0.3, 0.5, 3)
    for pass_idx, scale in enumerate(scales):
        print(f"[Pass {pass_idx+1}] Refinement (scale={scale:.2f})...")
        new_thumbnails = []
        for i, text in enumerate(prompts):
            print(f"   Frame {i+1}/{frame_count}")
            result = storyadapter.generate(
                pil_image=thumbnails,
                use_image=True,
                prompt=text,
                scale=scale,
                num_samples=1,
                num_inference_steps=20,
                seed=42,
                style=style,
            )
            new_thumbnails.append(result[0].resize((256, 256)))
        thumbnails = new_thumbnails

    # ------------------------------------------------------------------
    # Final pass: full-resolution output saved to disk
    # ------------------------------------------------------------------
    print(f"[Final Pass] Generating full-resolution output...")
    results = []
    for i, text in enumerate(prompts):
        print(f"   Frame {i+1}/{frame_count}")
        result = storyadapter.generate(
            pil_image=thumbnails,
            use_image=True,
            prompt=text,
            scale=0.5,
            num_samples=1,
            num_inference_steps=20,
            seed=42,
            style=style,
        )
        img_filename = f"frame_{uuid.uuid4().hex[:8]}.png"
        img_path = os.path.join("generated_videos", img_filename)
        result[0].save(img_path)
        results.append((img_path, narrations[i]))
        print(f"   Saved → {img_filename}")

    print(f"✅ Story-Iter complete: {len(results)} frames generated.")
    return results

# ============================================================================
# VIDEO COMPILER (unchanged from server.py)
# ============================================================================
def create_full_story_video(frame_tuples: List[tuple], output_path: str) -> bool:
    try:
        clips = []

        for i, (image_path, narration) in enumerate(frame_tuples):
            print(f"   ... Rendering clip {i+1}/{len(frame_tuples)}")

            audio_path = image_path.replace(".png", ".mp3")
            tts = gTTS(text=narration, lang='en')
            tts.save(audio_path)

            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration + 0.5

            clip = ImageClip(image_path).set_duration(duration)
            w, h = clip.size
            zoomed = clip.resize(lambda t: 1 + 0.025 * t).set_position(('center', 'center'))
            composite = CompositeVideoClip([zoomed], size=(w, h)).set_audio(audio_clip)
            clips.append(composite)

        print(f"   ... Concatenating {len(clips)} clips into final video")
        final_video = concatenate_videoclips(clips, method="compose")
        final_video.write_videofile(
            output_path,
            fps=24,
            codec="libx264",
            preset="ultrafast",
            audio_codec="aac",
        )

        for clip in clips:
            try:
                clip.close()
            except Exception:
                pass

        return True

    except Exception as e:
        print(f"❌ Video Engine Error: {e}")
        return False

# ============================================================================
# API
# ============================================================================
app = FastAPI(title="Cinder Backend API — Story-Iter Edition")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.makedirs("generated_videos", exist_ok=True)
app.mount("/videos", StaticFiles(directory="generated_videos"), name="videos")


# In-memory job store: jobId -> {"status": "processing"|"done"|"error", ...}
jobs: Dict[str, Any] = {}


@app.get("/health")
def health():
    return {"status": "ok", "engine": "story-iter", "device": DEVICE}


@app.get("/job/{job_id}")
def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


def _run_generation(job_id: str, request: GenerateStoryRequest):
    try:
        story_id = f"{request.userId}_{uuid.uuid4().hex[:8]}"

        frame_tuples = generate_images_via_story_iter(
            request.prompt,
            request.frameCount,
            request.style,
            request.referenceImage,
        )

        video_name = f"story_{uuid.uuid4().hex[:8]}.mp4"
        video_path = os.path.join("generated_videos", video_name)
        success = create_full_story_video(frame_tuples, video_path)
        if not success:
            raise Exception("Video compilation failed")

        video_url = upload_to_firebase(video_path, f"videos/{video_name}")
        print(f"✅ Story video ready: {video_url}")

        frames = []
        for i, (img_path, narration) in enumerate(frame_tuples):
            img_filename = os.path.basename(img_path)
            img_url = upload_to_firebase(img_path, f"images/{img_filename}")
            frames.append({"index": i, "narration": narration, "imageUrl": img_url})

        jobs[job_id] = {
            "status": "done",
            "storyId": story_id,
            "frames": frames,
            "videoUrl": video_url,
        }
        print(f"✅ Job {job_id} complete.")

    except Exception as e:
        print(f"❌ Job {job_id} failed: {e}")
        jobs[job_id] = {"status": "error", "detail": str(e)}


@app.post("/generate-story")
async def generate_story(request: GenerateStoryRequest):
    job_id = uuid.uuid4().hex[:12]
    jobs[job_id] = {"status": "processing"}
    thread = threading.Thread(target=_run_generation, args=(job_id, request), daemon=True)
    thread.start()
    print(f"🚀 Job {job_id} started in background.")
    return {"jobId": job_id, "status": "processing"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
