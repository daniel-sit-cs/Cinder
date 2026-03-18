# Cinder — System Architecture

> AI-powered storyboard generator: React Native mobile app + FastAPI backend + Firebase + Story-Iter/NAVIS on Google Colab

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CINDER SYSTEM                                  │
│                                                                         │
│   ┌──────────────────┐    HTTP (ngrok)    ┌───────────────────────────┐ │
│   │   MOBILE APP     │  ────────────────► │   FASTAPI BACKEND         │ │
│   │  React Native    │  ◄────────────────  │   colab_server.py         │ │
│   │  Expo SDK 54     │   async job poll   │   Google Colab A100       │ │
│   └────────┬─────────┘                   └─────────────┬─────────────┘ │
│            │                                           │                │
│            │ Firebase SDK                              │ Firebase Admin │
│            ▼                                           ▼                │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                       FIREBASE (Google Cloud)                    │  │
│   │   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │  │
│   │   │     Auth     │  │  Firestore   │  │   Cloud Storage       │ │  │
│   │   │  (users)     │  │  (projects)  │  │  (images + videos)    │ │  │
│   │   └──────────────┘  └──────────────┘  └───────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                           │                             │
│                                           │ StoryAdapterXL (local)      │
│                                           ▼                             │
│                             ┌────────────────────────┐                 │
│                             │   STORY-ITER / NAVIS    │                 │
│                             │  RealVisXL_V4 base      │                 │
│                             │  IP-Adapter SDXL        │                 │
│                             │  4-pass refinement      │                 │
│                             └────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Mobile** | React Native | 0.81.4 | Cross-platform UI |
| **Mobile Framework** | Expo | 54.0.7 | Build toolchain & native APIs |
| **Language** | TypeScript | 5.9.2 | Type safety |
| **Navigation** | React Navigation | 7.x | Screen routing |
| **Backend** | FastAPI | 0.115.0 | REST API server |
| **Backend Language** | Python | 3.12 | Server logic |
| **AI Model** | Story-Iter / NAVIS (StoryAdapterXL) | — | 4-pass iterative story image generation |
| **Base Diffusion Model** | RealVisXL V4.0 | — | SDXL-based image generation |
| **Consistency Module** | IP-Adapter SDXL | — | Cross-frame visual consistency |
| **GPU** | Google Colab Pro A100 | 40GB VRAM | Model inference |
| **Tunnel** | ngrok | free tier | Expose Colab server to mobile app |
| **Database** | Firebase Firestore | SDK 12.8.0 | Project storage |
| **Auth** | Firebase Auth | SDK 12.8.0 | User accounts |
| **File Storage** | Firebase Cloud Storage | Admin SDK | Images & videos |
| **Text-to-Speech** | gTTS (Google TTS) | Python | Frame narration audio |
| **Video** | MoviePy | Python | Compile frames into .mp4 |
| **Icons** | Lucide React Native | 0.563.0 | UI icons |

---

## 3. Directory Structure

```
Cinder/
│
├── index.tsx                        ← Expo entry point
├── app.json                         ← Expo config (bundle IDs, version)
├── package.json                     ← npm dependencies
├── tsconfig.json                    ← TypeScript config
│
├── src/                             ← Frontend source
│   ├── App.tsx                      ← Root component + auth gate + navigation
│   ├── firebaseConfig.ts            ← Firebase SDK init (auth, db, storage)
│   │
│   ├── api/
│   │   └── storyService.ts          ← Async job client (POST + poll /job/{id})
│   │
│   ├── navigation/
│   │   └── screens/
│   │       ├── WelcomeScreen.tsx    ← Landing page (animated hero)
│   │       ├── Login.tsx            ← Sign in form
│   │       ├── Signup.tsx           ← Register form
│   │       ├── Home.tsx             ← Dashboard (masonry grid + FAB)
│   │       ├── Editor.tsx           ← Story creation + result viewer
│   │       └── ProjectDetail.tsx    ← View a saved storyboard
│   │
│   ├── theme/
│   │   └── tokens.ts                ← Design tokens (colors, spacing, fonts)
│   │
│   └── types/
│       └── story.ts                 ← TypeScript interfaces (Frame, Response)
│
├── backend/                         ← Python backend
│   ├── colab_server.py              ← FastAPI app (Story-Iter pipeline) ← PRODUCTION
│   ├── server.py                    ← Legacy local server (Replicate API)
│   ├── cinder_colab.ipynb           ← Colab setup notebook (run this)
│   ├── requirements_colab.txt       ← Python dependencies for Colab
│   ├── firebase-key.json            ← Firebase service account (secret, not committed)
│   ├── .env                         ← Secrets (not committed)
│   └── generated_videos/            ← Temp output (images, audio, mp4s)
│
├── NAVIS-main/                      ← Story-Iter model source
│   ├── ip_adapter/                  ← StoryAdapterXL + IP-Adapter implementation
│   ├── story_vis.py                 ← Standalone image generation script
│   ├── story_gen.py                 ← Narration generation (Qwen2.5-VL)
│   └── video_gen.py                 ← Video compilation script
│
└── assets/                          ← App icons & splash screen
```

---

## 4. Frontend Architecture

### 4.1 Navigation Flow

```
App.tsx (Auth Gate)
    │
    ├── [NOT LOGGED IN]
    │       ▼
    │   WelcomeScreen ──► Login ──────────────┐
    │       │                                  │
    │       └──────────── Signup ─────────────┘
    │                                          │
    │                            Firebase Auth ▼
    │
    └── [LOGGED IN]
            ▼
          Home  ◄────────────────────────────────┐
            │                                    │
            ├──── FAB / New Story ──► Editor ────┘ (save → Home)
            │
            └──── Project Card ──► ProjectDetail
```

### 4.2 Screen Responsibilities

| Screen | Responsibility |
|--------|---------------|
| `WelcomeScreen` | Animated hero, entry point for auth |
| `Login` | Firebase `signInWithEmailAndPassword` |
| `Signup` | Firebase `createUserWithEmailAndPassword` |
| `Home` | Fetches user's projects from Firestore. Masonry grid. |
| `Editor` | Collects prompt/style/frames/reference image → calls backend → displays results |
| `ProjectDetail` | Read-only view of a saved project's frames and narrations |

### 4.3 Async Generation Flow in Editor

```
[INPUT VIEW]           [LOADING VIEW]              [RESULT VIEW]
  prompt ──────►  POST /generate-story ──────►  frames[]
  style           ← returns jobId instantly       storyVideoUrl
  frameCount
  referenceImage?      ↓ poll every 5s
                  GET /job/{jobId}
                  until status === "done"
                       ↓
                  Firebase Storage URLs
                       ↓
                  Firestore save (handleSave)
```

---

## 5. Backend Architecture

### 5.1 Story-Iter / NAVIS Pipeline

```
POST /generate-story
        │
        ▼  (returns jobId immediately, runs in background thread)
┌───────────────────────────────────────────────────────┐
│  Pass 0: INITIAL GENERATION (per frame)                │
│                                                        │
│  referenceImage provided?                              │
│    YES → pil_image=[character_image], use_image=True   │
│           scale=0.3, 20 steps                          │
│    NO  → pil_image=None, use_image=False               │
│           pure text-to-image generation                │
│                                                        │
│  Output: thumbnails[] (256×256 PIL Images)             │
└──────────────────┬────────────────────────────────────┘
                   ▼
┌───────────────────────────────────────────────────────┐
│  Passes 1–3: ITERATIVE REFINEMENT                      │
│                                                        │
│  Each pass:                                            │
│    pil_image = thumbnails (all previous frames)        │
│    use_image = True                                    │
│    scale: 0.30 → 0.40 → 0.50 (increasing influence)   │
│                                                        │
│  This is Story-Iter's GRCA cross-attention:            │
│  each frame attends to ALL other frames for            │
│  semantic consistency across the storyboard            │
└──────────────────┬────────────────────────────────────┘
                   ▼
┌───────────────────────────────────────────────────────┐
│  Final Pass: FULL-RESOLUTION OUTPUT                    │
│                                                        │
│  pil_image = refined thumbnails                        │
│  Full resolution PNG saved to generated_videos/        │
└──────────────────┬────────────────────────────────────┘
                   ▼
┌───────────────────────────────────────────────────────┐
│  VIDEO COMPILATION (MoviePy)                           │
│                                                        │
│  For each frame:                                       │
│    1. gTTS: narration text → .mp3 audio               │
│    2. ImageClip: image + audio duration               │
│    3. Ken Burns zoom: clip.resize(1 + 0.025 * t)      │
│    4. CompositeVideoClip: image + audio               │
│                                                        │
│  concatenate_videoclips(all_clips) → story.mp4        │
└──────────────────┬────────────────────────────────────┘
                   ▼
┌───────────────────────────────────────────────────────┐
│  FIREBASE UPLOAD                                       │
│                                                        │
│  video  → Firebase Storage: videos/story_{id}.mp4     │
│  images → Firebase Storage: images/frame_{id}.png     │
│                                                        │
│  Returns: signed URLs (7-day expiry)                  │
└──────────────────┬────────────────────────────────────┘
                   ▼
         jobs[jobId] = {
           status: "done",
           storyId, frames[], videoUrl
         }
         (client polling GET /job/{jobId} receives this)
```

### 5.2 Story Beats System

The backend uses 15 pre-defined `STORY_BEATS` — a cinematic 3-act narrative arc. Each beat provides a scene template and narration template that gets formatted with the user's prompt.

### 5.3 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Server health check |
| `POST` | `/generate-story` | Start generation job, returns `jobId` immediately |
| `GET`  | `/job/{jobId}` | Poll job status: `processing` / `done` / `error` |
| `GET`  | `/videos/{filename}` | Serve local generated video files |

**POST `/generate-story` request:**
```json
{
  "userId":         "string  — Firebase UID",
  "prompt":         "string  — Story description",
  "style":          "string? — e.g. 'Cinematic', 'Comic', 'Storybook'",
  "frameCount":     "int     — 1 to 15",
  "referenceImage": "string? — base64 JPEG (optional character seeding)"
}
```

**POST `/generate-story` response (immediate):**
```json
{ "jobId": "abc123", "status": "processing" }
```

**GET `/job/{jobId}` response (when done):**
```json
{
  "status":   "done",
  "storyId":  "userId_hex",
  "frames": [
    { "index": 0, "narration": "string", "imageUrl": "signed-url" }
  ],
  "videoUrl": "signed-url"
}
```

---

## 6. Database Schema (Firestore)

### Collection: `projects`

```
projects/
  └── {documentId}/
        ├── userId:    string   — Firebase Auth UID
        ├── title:     string   — First 4 words of prompt + "..."
        ├── prompt:    string   — Full story description
        ├── style:     string   — Visual style selected
        ├── date:      string   — Human-readable date
        ├── createdAt: number   — Unix timestamp (for sorting)
        └── frames: [
              {
                index:     number,
                narration: string,
                imageUrl:  string  — Firebase Storage signed URL
              }
            ]
```

---

## 7. Character Consistency — Story-Iter / IP-Adapter

```
User uploads reference photo (optional)
          │
          │ base64 encoded
          ▼
  Editor.tsx → storyService.ts → POST /generate-story
                                  { referenceImage: "base64..." }
                                          │
                                          ▼
                              _run_generation() [background thread]
                                          │
                                  Pass 0: pil_image=[character_image]
                                          │
                                  Passes 1-3: use story thumbnails
                                  as cross-frame visual context
                                  (Story-Iter GRCA cross-attention)
                                          │
                                  Result: stylistically consistent
                                  frames across the storyboard
```

Note: `StoryAdapterXL` uses IP-Adapter SDXL (not FaceID). The reference image influences style and visual features rather than exact face replication. Strong character consistency is achieved through the iterative refinement passes.

---

## 8. Design System

All UI tokens are defined in `src/theme/tokens.ts`:

```
Background layers:   #0D0D0F  →  #1A1A2E  →  #1E1E2A
Primary accent:      #7C5CFC  (electric violet)
Secondary accent:    #4ECDC4  (cyan)
Text primary:        #F0F0F5
Text secondary:      #8888A0
Border:              rgba(255,255,255,0.06)
Success:             #00D68F
Error:               #FF6B6B
```

---

## 9. Data Flow — End to End

```
USER
 │
 │  1. Opens app
 ▼
WelcomeScreen → Login/Signup → Firebase Auth
 │
 │  2. Authenticated
 ▼
Home Screen
 │  (Firestore query: projects where userId == uid)
 │
 │  3. Taps FAB "+"
 ▼
Editor Screen
 │  Fills: prompt, style, frameCount, optional photo
 │
 │  4. Taps "Generate Storyboard"
 ▼
storyService.ts
 │  POST https://{ngrok-url}/generate-story
 │  ← receives jobId immediately
 │  polls GET /job/{jobId} every 5s
 │
 ▼
colab_server.py (Google Colab A100)
 │  → Story-Iter: 4-pass image generation
 │  → gTTS: N audio clips
 │  → MoviePy: compile → 1 .mp4
 │  → Firebase Storage: upload images + video
 │  → jobs[jobId] = { status: "done", ... }
 │
 │  5. Poll returns status "done" (~3-10 min)
 ▼
Editor Result View
 │  Shows: full video player + frame grid + narrations
 │
 │  6. Taps "Save to Library"
 ▼
Firestore: addDoc("projects", { frames, videoUrl... })
 │
 │  7. Navigate back to Home
 ▼
Home (masonry grid, tap card → ProjectDetail)
```

---

## 10. Environment & Configuration

### Frontend (`src/api/storyService.ts`)
```typescript
const API_URL = 'https://{ngrok-url}'; // from Colab Cell 5 output
```

### Backend (`backend/.env`)
```
HF_TOKEN=hf_...   # HuggingFace token (for model downloads if needed)
```

### Backend (`backend/firebase-key.json`)
Firebase service account credentials — used by Firebase Admin SDK to upload files to Cloud Storage.

### Firebase Project
```
Project ID:      cinder-9012f
Auth Domain:     cinder-9012f.firebaseapp.com
Storage Bucket:  cinder-9012f.firebasestorage.app
```

### Colab Setup
- Runtime: GPU → A100 (40GB VRAM)
- Model checkpoints: downloaded via Cell 3 (~10 GB total)
  - RealVisXL_V4.0 (7 GB) — base diffusion model
  - IP-Adapter SDXL weights (500 MB)
  - CLIP image encoder (1.7 GB)
