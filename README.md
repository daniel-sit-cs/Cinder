# Cinder — AI Storyboard Generator

A mobile app that turns a text prompt into a fully narrated, AI-generated storyboard video. Built as a capstone project using Story-Iter/NAVIS for image generation, Firebase for auth and storage, and Google Colab as the cloud GPU backend.

---

## How It Works

1. User enters a story prompt, picks a style and frame count, and optionally uploads a reference character image
2. The app sends the request to a FastAPI server running on Google Colab (A100 GPU)
3. The server runs **Story-Iter** (NAVIS) — a 4-pass iterative refinement pipeline that generates visually consistent frames
4. Each frame gets TTS narration (gTTS) and a Ken Burns animation
5. MoviePy compiles everything into a single `.mp4`
6. Video and images are uploaded to Firebase Storage and returned to the app

---

## Running the App

### Prerequisites
- Node.js + npm
- Expo Go app on your phone
- Google Colab Pro (A100 GPU)
- Firebase project credentials
- ngrok account (free tier)

### 1. Start the backend (Google Colab)

Open `backend/cinder_colab.ipynb` in Google Colab and run cells 1–5 in order:

| Cell | What it does |
|------|-------------|
| 1 | Verify GPU, clone repo |
| 2 | Install dependencies |
| 3 | Download model checkpoints (~10 GB) |
| 4 | Copy Firebase secrets from Google Drive |
| 5 | Start FastAPI server + open ngrok tunnel |

Cell 5 prints a ngrok URL like `https://xxxx.ngrok-free.app`.

### 2. Update the API URL

In `src/api/storyService.ts`, set:

```typescript
const API_URL = 'https://xxxx.ngrok-free.app'; // from Cell 5
```

### 3. Start the frontend

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go. The app connects to the Colab backend via ngrok.

---

## Project Structure

```
Cinder/
├── src/                        ← React Native frontend (TypeScript)
│   ├── App.tsx                 ← Root + Firebase auth gate + navigation
│   ├── api/storyService.ts     ← HTTP client (async job polling)
│   ├── navigation/screens/     ← All screens
│   └── theme/tokens.ts         ← Design tokens
├── backend/
│   ├── colab_server.py         ← FastAPI server (Story-Iter/NAVIS pipeline)
│   ├── cinder_colab.ipynb      ← Colab setup notebook
│   ├── requirements_colab.txt  ← Python dependencies for Colab
│   └── server.py               ← Legacy local server (Replicate API)
├── NAVIS-main/                 ← Story-Iter model (ip_adapter, story_vis, etc.)
└── ARCHITECTURE.md             ← Full system design doc
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 + Expo 54 |
| Language | TypeScript |
| Navigation | React Navigation 7 |
| Backend | FastAPI + Python 3.12 |
| AI Model | Story-Iter / NAVIS (StoryAdapterXL) |
| GPU | Google Colab Pro (A100 40GB) |
| Tunnel | ngrok |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Cloud Storage |
| TTS | gTTS |
| Video | MoviePy |

---

## Secrets Setup

Before running Cell 4 in Colab, upload these files to `MyDrive/cinder-secrets/` on Google Drive:

- `firebase-key.json` — Firebase service account key
- `.env` — can be empty or contain `HF_TOKEN` if needed

These are never committed to git.
