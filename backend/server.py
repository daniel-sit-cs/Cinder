"""
Cinder Backend API - NAVIS Model Wrapper
FastAPI server for Interactive Visual Storytelling
"""

import os
import sys
import uuid
import base64
import json
from io import BytesIO
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from PIL import Image  # <--- MAKE SURE THIS IS HERE!
import random

# Add NAVIS-main to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'NAVIS-main'))

# Configuration flag for mock mode
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

# Import NAVIS modules only if not in mock mode
if not MOCK_MODE:
    try:
        import torch
        from diffusers import StableDiffusionXLPipeline, DDIMScheduler
        from PIL import Image
        from ip_adapter import StoryAdapterXL
        from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
        from qwen_vl_utils import process_vision_info
        print("✓ NAVIS dependencies loaded successfully")
    except ImportError as e:
        print(f"⚠ Warning: Could not import NAVIS dependencies: {e}")
        print("⚠ Falling back to MOCK_MODE")
        MOCK_MODE = True

# ============================================================================
# Data Models (Strict Contract)
# ============================================================================

class GenerateStoryRequest(BaseModel):
    userId: str  # Firebase UID
    prompt: str  # User's story idea
    style: Optional[str] = "storybook"  # watercolor, comic, film, realistic, storybook
    frameCount: int = 4  # Number of frames to generate

class Frame(BaseModel):
    index: int
    narration: str  # Generated text
    imageUrl: str  # Base64-encoded image or URL

class GenerateStoryResponse(BaseModel):
    status: str
    storyId: str
    frames: List[Frame]

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="Cinder Backend API",
    description="NAVIS Model Wrapper for Interactive Visual Storytelling",
    version="1.0.0"
)

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Model Initialization (Only if not in mock mode)
# ============================================================================

story_generator = None
image_generator = None

def initialize_models():
    """Initialize NAVIS models - only called if MOCK_MODE is False"""
    global story_generator, image_generator
    
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Initializing models on device: {device}")
        
        # Initialize image generation model
        base_model_path = "ckpt/story-ad/RealVisXL_V4"
        image_encoder_path = "ckpt/ipa/sdxl_models/image_encoder"
        ip_ckpt = "ckpt/ip-adapter_sdxl.bin"
        
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
            base_model_path,
            torch_dtype=torch.float16,
            scheduler=noise_scheduler,
            feature_extractor=None,
            safety_checker=None
        )
        
        image_generator = StoryAdapterXL(pipe, image_encoder_path, ip_ckpt, device)
        
        # Initialize narration generation model
        story_generator = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            "ckpt/qwenvl7",
            torch_dtype=torch.bfloat16,
            attn_implementation="flash_attention_2",
            device_map="auto",
        )
        
        print("✓ Models initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Error initializing models: {e}")
        return False

if not MOCK_MODE:
    initialize_models()

# ============================================================================
# Helper Functions
# ============================================================================

def pil_image_to_base64(image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def generate_mock_story(prompt: str, frame_count: int, style: str) -> List[Frame]:
    """Generate mock story with narratives strictly aligned to the 'Magical Forest' demo images."""
    mock_frames = []
    
    # These narratives are written to match the 'demo1-4.jpg' visual flow perfectly.
    # We inject the user's prompt slightly to make it feel dynamic.
    narratives = [
        # Frame 1: Matches demo1.jpg (Character at edge of forest)
        f"Our story begins with {prompt}. The air was filled with anticipation as the journey into the unknown woods was about to start.",
        
        # Frame 2: Matches demo2.jpg (Path in trees)
        "Deeper into the forest, the trees began to glow with a mysterious light. The path twisted and turned, leading further into the magic.",
        
        # Frame 3: Matches demo3.jpg (The Discovery/Glowing Object)
        "Suddenly, a brilliant light caught the eye! Hidden among the ancient roots lay the object of the quest, pulsating with energy.",
        
        # Frame 4: Matches demo4.jpg (Sunset/Celebration)
        "With the treasure found, peace returned to the land. The adventure had come to a happy end, leaving memories that would last forever."
    ]
    
    print(f"🎨 MOCK MODE: Generating story for prompt: '{prompt}'")

    for i in range(frame_count):
        # Cycle through demo1.jpg -> demo4.jpg
        image_index = (i % 4) + 1 
        image_filename = f"demo{image_index}.jpg"
        
        try:
            with Image.open(image_filename) as img:
                # Resize to standard AI shape
                img = img.resize((512, 512))
                image_base64 = pil_image_to_base64(img)
        except Exception as e:
            print(f"⚠️ MISSING IMAGE: Could not find {image_filename}. Please download it!")
            # Fallback blue box (Safety net)
            img = Image.new('RGB', (512, 512), color=(50, 150, 50)) 
            image_base64 = pil_image_to_base64(img)

        # Select the matching narration
        text = narratives[i % len(narratives)]

        mock_frames.append(Frame(
            index=i,
            narration=text,
            imageUrl=image_base64
        ))
    
    return mock_frames

def generate_real_story(prompt: str, frame_count: int, style: str, seed: int = 42) -> List[Frame]:
    """Generate real story using NAVIS models"""
    frames = []
    
    try:
        # Step 1: Generate images
        print(f"Generating {frame_count} images with style: {style}")
        images = []
        prompts_list = []
        
        # For simplicity, use the same prompt for all frames initially
        # In production, you'd want to break down the story into scenes
        for i in range(frame_count):
            frame_prompt = f"{prompt}, scene {i+1}"
            prompts_list.append(frame_prompt)
            
            # Generate image
            generated_images = image_generator.generate(
                pil_image=images if images else None,
                num_samples=1,
                num_inference_steps=50,
                seed=seed,
                prompt=frame_prompt,
                scale=0.3 + (i * 0.05),
                use_image=bool(images),
                style=style
            )
            images.append(generated_images[0])
        
        # Step 2: Generate narrations
        print("Generating narrations...")
        processor = AutoProcessor.from_pretrained("ckpt/qwenvl7")
        
        generated_narrations = []
        for frame_idx in range(frame_count):
            # Build messages for narration generation
            messages = build_narration_messages(
                images[:frame_idx+1],
                prompts_list[:frame_idx+1],
                generated_narrations,
                frame_idx
            )
            
            # Generate narration
            text = processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to("cuda")
            
            generated_ids = story_generator.generate(
                **inputs,
                max_new_tokens=128,
                do_sample=True,
                num_beams=1,
                temperature=0.7,
                top_p=0.9
            )
            
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(
                generated_ids_trimmed,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False
            )
            
            narration = output_text[0]
            generated_narrations.append(narration)
            
            # Convert image to base64
            image_base64 = pil_image_to_base64(images[frame_idx])
            
            frames.append(Frame(
                index=frame_idx,
                narration=narration,
                imageUrl=image_base64
            ))
        
        return frames
        
    except Exception as e:
        print(f"Error generating real story: {e}")
        raise HTTPException(status_code=500, detail=f"Story generation failed: {str(e)}")

def build_narration_messages(images, prompts, narrations, frame_idx):
    """Build messages for Qwen model (simplified version)"""
    SYSTEM_PROMPT = """You are a visual storyteller. Write one paragraph (10-20 words) 
    continuing the story based on the image and description. Use simple, age-appropriate 
    language for children aged 5-8."""
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    content = []
    if frame_idx > 0:
        for i in range(max(0, frame_idx - 3), frame_idx):
            content.append({"type": f"image_{i}", "image": images[i]})
            content.append({"type": "text", "text": f"Narration {i+1}: {narrations[i]}"})
    
    content.append({"type": "current_image", "image": images[frame_idx]})
    content.append({"type": "text", "text": f"Description: {prompts[frame_idx]}"})
    content.append({"type": "text", "text": f"Write narration for frame {frame_idx+1}:"})
    
    messages.append({"role": "user", "content": content})
    return messages

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Cinder Backend API",
        "status": "running",
        "mode": "mock" if MOCK_MODE else "production",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "mock_mode": MOCK_MODE,
        "models_loaded": not MOCK_MODE and (story_generator is not None),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/generate-story", response_model=GenerateStoryResponse)
async def generate_story(request: GenerateStoryRequest):
    """
    Generate a visual story with narration
    
    Request Body:
    - userId: Firebase UID
    - prompt: User's story idea
    - style: Visual style (watercolor, comic, film, realistic, storybook)
    - frameCount: Number of frames (default 4)
    
    Response:
    - status: "success" or "error"
    - storyId: Unique story identifier
    - frames: Array of frames with narration and images
    """
    try:
        print(f"Received story generation request from user: {request.userId}")
        print(f"Prompt: {request.prompt}")
        print(f"Style: {request.style}, Frames: {request.frameCount}")
        
        # Generate unique story ID
        story_id = f"{request.userId}_{uuid.uuid4().hex[:8]}"
        
        # Validate frame count
        if request.frameCount < 1 or request.frameCount > 10:
            raise HTTPException(
                status_code=400,
                detail="frameCount must be between 1 and 10"
            )
        
        # Generate story (mock or real)
        if MOCK_MODE:
            print("Using MOCK_MODE to generate story")
            frames = generate_mock_story(request.prompt, request.frameCount, request.style)
        else:
            print("Using real NAVIS models to generate story")
            frames = generate_real_story(request.prompt, request.frameCount, request.style)
        
        response = GenerateStoryResponse(
            status="success",
            storyId=story_id,
            frames=frames
        )
        
        print(f"✓ Story generated successfully: {story_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Error generating story: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate story: {str(e)}"
        )

# ============================================================================
# Server Entry Point
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🔥 Cinder Backend API - NAVIS Model Wrapper")
    print("=" * 60)
    print(f"Mode: {'MOCK (Testing)' if MOCK_MODE else 'PRODUCTION (GPU Required)'}")
    print(f"Models loaded: {not MOCK_MODE and (story_generator is not None)}")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
