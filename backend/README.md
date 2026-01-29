# Cinder Backend API

FastAPI wrapper around the NAVIS model for Interactive Visual Storytelling.

## 🎯 Features

- **POST /generate-story** - Generate visual stories with narration
- **Strict Data Contract** - Matches frontend TypeScript interfaces
- **Mock Mode** - Test API without GPU requirements
- **CORS Enabled** - Ready for mobile app integration
- **Production Mode** - Full NAVIS model integration when GPU available

## 📋 Data Contract

### Request (POST /generate-story)
```json
{
  "userId": "string (firebase_uid)",
  "prompt": "string (the user's story idea)",
  "style": "string (optional, e.g., 'watercolor', 'storybook')",
  "frameCount": "integer (default 4)"
}
```

### Response
```json
{
  "status": "success",
  "storyId": "string",
  "frames": [
    {
      "index": 0,
      "narration": "string (generated text)",
      "imageUrl": "string (base64-encoded image)"
    }
  ]
}
```

## 🚀 Quick Start (Mock Mode - No GPU Required)

### 1. Install Dependencies
```bash
cd backend
pip install fastapi uvicorn pydantic pillow
```

### 2. Run Server in Mock Mode
```bash
# Set environment variable for mock mode
set MOCK_MODE=true

# Run server
python server.py
```

The server will start at `http://localhost:8000`

### 3. Test the API

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Generate Story (Mock):**
```bash
curl -X POST http://localhost:8000/generate-story \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"test_user_123\",\"prompt\":\"A brave knight goes on an adventure\",\"style\":\"storybook\",\"frameCount\":4}"
```

## 🖥️ Production Mode (GPU Required)

### Prerequisites
- CUDA 12.1 + cuDNN 8.9.02
- Python 3.10
- NVIDIA GPU with at least 16GB VRAM

### 1. Create Conda Environment
```bash
conda create -n StoryAdapter python=3.10
conda activate StoryAdapter
```

### 2. Install All Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Download Model Checkpoints

Create a `ckpt` directory in the project root and download:

- **RealVisXL_V4.0** → `ckpt/story-ad/RealVisXL_V4/`
  - From: https://huggingface.co/SG161222/RealVisXL_V4.0

- **CLIP Image Encoder** → `ckpt/ipa/sdxl_models/image_encoder/`
  - From: https://huggingface.co/h94/IP-Adapter/tree/main/sdxl_models/image_encoder

- **IP-Adapter SDXL** → `ckpt/ip-adapter_sdxl.bin`
  - From: https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter_sdxl.bin

- **Qwen2.5-VL-7B** → `ckpt/qwenvl7/`
  - From: https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct

### 4. Run in Production Mode
```bash
set MOCK_MODE=false
python server.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Mock mode (set to 'false' for production with GPU)
MOCK_MODE=true

# Server configuration
HOST=0.0.0.0
PORT=8000
```

### Supported Styles
- `storybook` (default)
- `comic`
- `film`
- `realistic`
- `watercolor`

## 📚 API Documentation

Once the server is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🧪 Testing with Your Frontend

Update your React Native app's API endpoint:

```typescript
const API_BASE_URL = 'http://localhost:8000';  // or your server IP

async function generateStory(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/generate-story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: currentUser.uid,
      prompt: prompt,
      style: 'storybook',
      frameCount: 4
    })
  });
  
  const data = await response.json();
  return data;
}
```

## 📁 Project Structure

```
backend/
├── server.py           # Main FastAPI application
├── requirements.txt    # Python dependencies
└── README.md          # This file

NAVIS-main/            # NAVIS model code
├── story_vis.py       # Image generation
├── story_gen.py       # Narration generation
├── ip_adapter/        # IP-Adapter modules
└── ...
```

## 🐛 Troubleshooting

### "Cannot import NAVIS dependencies"
- Make sure you're in mock mode: `set MOCK_MODE=true`
- Or install all dependencies: `pip install -r requirements.txt`

### CUDA Out of Memory
- Reduce `frameCount` in your requests
- Use a smaller batch size
- Consider using model quantization

### Port Already in Use
- Change port: `uvicorn server:app --port 8001`

## 🔐 Security Notes

⚠️ **Before Production Deployment:**

1. **CORS Configuration**: Update `allow_origins` in `server.py` to your specific domain
2. **Authentication**: Add authentication middleware to verify Firebase tokens
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS**: Use HTTPS in production (nginx/reverse proxy)

## 📝 License

This wrapper API is part of the Cinder project. The NAVIS model has its own license terms.

## 🤝 Contributing

For issues or improvements, please contact the Cinder development team.
