# Cinder — System Architecture

> AI-powered storyboard generator: React Native mobile app + FastAPI backend + Firebase + Replicate AI

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CINDER SYSTEM                                  │
│                                                                         │
│   ┌──────────────────┐       HTTP        ┌───────────────────────────┐  │
│   │   MOBILE APP     │  ─────────────►   │    FASTAPI BACKEND        │  │
│   │  React Native    │  ◄─────────────   │    Python (server.py)     │  │
│   │  Expo SDK 54     │    JSON response  │    Port 8000              │  │
│   └────────┬─────────┘                  └─────────────┬─────────────┘  │
│            │                                          │                 │
│            │ Firebase SDK                             │ Firebase Admin  │
│            ▼                                          ▼                 │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                       FIREBASE (Google Cloud)                    │  │
│   │   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │  │
│   │   │     Auth     │  │  Firestore   │  │   Cloud Storage       │ │  │
│   │   │  (users)     │  │  (projects)  │  │  (images + videos)    │ │  │
│   │   └──────────────┘  └──────────────┘  └───────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                          │                              │
│                                          │ Replicate API               │
│                                          ▼                              │
│                             ┌────────────────────────┐                 │
│                             │     REPLICATE AI        │                 │
│                             │  flux-schnell (images)  │                 │
│                             │  ip-adapter-sdxl-face   │                 │
│                             │  (character consistency) │                │
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
| **Database** | Firebase Firestore | SDK 12.8.0 | Project storage |
| **Auth** | Firebase Auth | SDK 12.8.0 | User accounts |
| **File Storage** | Firebase Cloud Storage | Admin SDK | Images & videos |
| **AI Images** | Replicate (Flux Schnell) | API | Story frame generation |
| **AI Consistency** | Replicate (IP-Adapter SDXL Face) | API | Character consistency |
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
│   │   └── storyService.ts          ← HTTP calls to FastAPI backend
│   │
│   ├── navigation/
│   │   ├── index.tsx                ← Alt nav config (createStaticNavigation)
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
│   ├── server.py                    ← FastAPI app (all routes + AI pipeline)
│   ├── requirements.txt             ← Python dependencies
│   ├── firebase-key.json            ← Firebase service account (secret)
│   ├── .env                         ← REPLICATE_API_TOKEN (secret)
│   └── generated_videos/            ← Temp output (images, audio, mp4s)
│
└── assets/                          ← App icons & splash screen
    ├── icon.png
    ├── adaptive-icon.png
    └── splash-icon.png
```

---

## 4. Frontend Architecture

### 4.1 Navigation Flow

```
App.tsx (Auth Gate)
    │
    ├── [NOT LOGGED IN]
    │       │
    │       ▼
    │   WelcomeScreen ──► Login ──────────────┐
    │       │                                  │
    │       └──────────── Signup ─────────────┘
    │                                          │
    │                            Firebase Auth ▼
    │
    └── [LOGGED IN]
            │
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
| `WelcomeScreen` | Animated hero, entry point for auth. Navigates to Login/Signup. |
| `Login` | Firebase `signInWithEmailAndPassword`. Focus-glow inputs, press animation. |
| `Signup` | Firebase `createUserWithEmailAndPassword`. Password strength bar, perk list. |
| `Home` | Fetches user's projects from Firestore. Masonry grid. Delete + open projects. |
| `Editor` | Collects prompt/style/frames/reference image → calls backend → displays results. |
| `ProjectDetail` | Read-only view of a saved project's frames and narrations. |

### 4.3 State Flow in Editor

```
[INPUT VIEW]                [LOADING VIEW]              [RESULT VIEW]
  prompt ──────────►  POST /generate-story  ──────►  frames[]
  style                  (Replicate AI)               storyVideoUrl
  frameCount             (MoviePy video)
  referenceImage?        (Firebase upload)
                              │
                              ▼
                         Firestore save
                        (handleSave)
```

---

## 5. Backend Architecture

### 5.1 AI Generation Pipeline

```
POST /generate-story
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Step 1: IMAGE GENERATION (per frame)                  │
│                                                        │
│  referenceImage?                                       │
│     YES → Replicate: lucataco/ip-adapter-sdxl-face     │
│            (IP-Adapter conditions each frame on        │
│             the same face → character consistency)     │
│                                                        │
│     NO  → Replicate: black-forest-labs/flux-schnell    │
│            (fast, prompt-only generation)              │
│                                                        │
│  Repeat for each of the N frames (STORY_BEATS)         │
└──────────────────┬────────────────────────────────────┘
                   │ N image files saved locally
                   ▼
┌───────────────────────────────────────────────────────┐
│  Step 2: VIDEO COMPILATION (MoviePy)                   │
│                                                        │
│  For each frame:                                       │
│    1. gTTS: narration text → .mp3 audio               │
│    2. ImageClip: image + audio duration               │
│    3. Ken Burns zoom: clip.resize(1 + 0.025 * t)      │
│    4. CompositeVideoClip: image + audio               │
│                                                        │
│  concatenate_videoclips(all_clips) → story.mp4        │
└──────────────────┬────────────────────────────────────┘
                   │ 1 .mp4 file
                   ▼
┌───────────────────────────────────────────────────────┐
│  Step 3: FIREBASE UPLOAD                               │
│                                                        │
│  video → Firebase Storage: videos/story_{id}.mp4      │
│  images → Firebase Storage: images/frame_{id}.png     │
│                                                        │
│  Returns: signed URLs (7-day expiry)                  │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
         GenerateStoryResponse {
           status, storyId,
           frames[{ index, narration, imageUrl }],
           videoUrl
         }
```

### 5.2 Story Beats System

The backend uses 15 pre-defined `STORY_BEATS` — a cinematic 3-act narrative arc built into `server.py`. Each beat provides a scene template and narration template. The AI prompt for each frame is assembled as:

```
"{style} style, highly detailed, cinematic lighting,
 {scene_beat}, featuring {prompt} as the main character"
```

### 5.3 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-story` | Full pipeline: images → video → Firebase → response |
| `GET` | `/videos/{filename}` | Serve local generated video files (static mount) |

**Request body** (`/generate-story`):
```json
{
  "userId":         "string  — Firebase UID",
  "prompt":         "string  — Story description",
  "style":          "string? — e.g. 'Cinematic', 'Anime'",
  "frameCount":     "int     — 1 to 15",
  "referenceImage": "string? — base64 JPEG (enables IP-Adapter)"
}
```

**Response**:
```json
{
  "status":   "success",
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

### Collection: `users` (managed by Firebase Auth)

Firebase Authentication stores email, UID, and creation date automatically. No manual user document needed.

---

## 7. Character Consistency — IP-Adapter

The professor requirement for **Story-Iter / IP-Adapter** is satisfied as follows:

```
User uploads reference photo (optional)
          │
          │ base64 encoded
          ▼
  Editor.tsx → storyService.ts → POST /generate-story
                                  { referenceImage: "base64..." }
                                          │
                                          ▼
                              generate_images_via_replicate()
                                          │
                                  use_ip_adapter = True
                                          │
                                          ▼
                            Replicate: lucataco/ip-adapter-sdxl-face
                            ┌─────────────────────────────────┐
                            │  prompt:  scene description      │
                            │  image:   data:image/jpeg;base64 │  ← same for ALL frames
                            │  scale:   0.6                    │
                            │  steps:   30                     │
                            └─────────────────────────────────┘
                                          │
                                  Character face is embedded
                                  into every generated frame
                                  → visual consistency across
                                    the entire storyboard
```

---

## 8. Design System

All UI tokens are defined in `src/theme/tokens.ts`:

```
Background layers:        #0D0D0F  →  #1A1A2E  →  #1E1E2A
Primary accent:           #7C5CFC  (electric violet)
Secondary accent:         #4ECDC4  (cyan)
Text primary:             #F0F0F5
Text secondary:           #8888A0
Border:                   rgba(255,255,255,0.06)
Success:                  #00D68F
Error:                    #FF6B6B
Warning / amber:          #F5A623
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
 │  POST http://{local-ip}:8000/generate-story
 │
 ▼
FastAPI server.py
 │  → Replicate API: generate N images
 │  → gTTS: generate N audio clips
 │  → MoviePy: compile → 1 .mp4
 │  → Firebase Storage: upload images + video
 │  → Return signed URLs
 │
 │  5. Response received (30s – 2min)
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
const API_URL = 'http://{local-machine-ip}:8000';
// Must be updated to match the machine running server.py
```

### Backend (`backend/.env`)
```
REPLICATE_API_TOKEN=r8_...   # Replicate API key
```

### Backend (`backend/firebase-key.json`)
```json
// Firebase service account credentials
// Used by Firebase Admin SDK to upload files to Cloud Storage
```

### Firebase Project
```
Project ID:      cinder-9012f
Auth Domain:     cinder-9012f.firebaseapp.com
Storage Bucket:  cinder-9012f.firebasestorage.app
```
