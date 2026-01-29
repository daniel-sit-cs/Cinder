# Frontend Integration Guide

## TypeScript Interfaces for React Native

Add these TypeScript interfaces to your frontend to match the API contract:

```typescript
// types/story.ts

export interface GenerateStoryRequest {
  userId: string;        // Firebase UID
  prompt: string;        // User's story idea
  style?: string;        // Optional: 'watercolor', 'comic', 'film', 'realistic', 'storybook'
  frameCount: number;    // Number of frames (default 4)
}

export interface Frame {
  index: number;
  narration: string;     // Generated text
  imageUrl: string;      // Base64-encoded image
}

export interface GenerateStoryResponse {
  status: string;        // 'success' or 'error'
  storyId: string;       // Unique identifier
  frames: Frame[];
}
```

## Example React Native Usage

```typescript
// services/storyApi.ts

import { auth } from '../firebaseConfig';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'  // Development (mock mode)
  : 'https://your-production-api.com';  // Production

export async function generateStory(
  prompt: string,
  style: string = 'storybook',
  frameCount: number = 4
): Promise<GenerateStoryResponse> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/generate-story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: currentUser.uid,
      prompt,
      style,
      frameCount
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate story');
  }

  return response.json();
}
```

## Example Component Usage

```typescript
// screens/StoryGenerator.tsx

import React, { useState } from 'react';
import { View, TextInput, Button, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { generateStory } from '../services/storyApi';
import type { GenerateStoryResponse, Frame } from '../types/story';

export default function StoryGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<GenerateStoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a story prompt');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await generateStory(prompt, 'storybook', 4);
      setStory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Story Generator
      </Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          marginBottom: 10
        }}
        placeholder="Enter your story idea..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={3}
      />

      <Button
        title={loading ? 'Generating...' : 'Generate Story'}
        onPress={handleGenerate}
        disabled={loading}
      />

      {loading && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Creating your story...</Text>
        </View>
      )}

      {error && (
        <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
      )}

      {story && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Story ID: {story.storyId}
          </Text>

          {story.frames.map((frame: Frame) => (
            <View key={frame.index} style={{ marginBottom: 30 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                Frame {frame.index + 1}
              </Text>
              
              <Image
                source={{ uri: frame.imageUrl }}
                style={{ width: '100%', height: 300, borderRadius: 8 }}
                resizeMode="cover"
              />
              
              <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 20 }}>
                {frame.narration}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
```

## Error Handling

The API returns standard HTTP status codes:

- **200 OK** - Story generated successfully
- **400 Bad Request** - Invalid input (e.g., frameCount out of range)
- **500 Internal Server Error** - Generation failed

Error response format:
```json
{
  "detail": "Error message here"
}
```

## Testing During Development

1. **Start the backend in mock mode:**
   ```bash
   cd backend
   run_mock.bat
   ```

2. **The server runs at:** `http://localhost:8000`

3. **Update your app to use the local server:**
   ```typescript
   const API_BASE_URL = 'http://YOUR_LOCAL_IP:8000';
   // Note: Use your computer's IP address, not localhost,
   // when testing on a physical device or emulator
   ```

4. **Find your local IP:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

## Production Deployment

When deploying to production with GPU:

1. Set `MOCK_MODE=false` in environment variables
2. Ensure all model checkpoints are downloaded
3. Configure proper CORS settings in `server.py`
4. Add authentication middleware to verify Firebase tokens
5. Implement rate limiting
6. Use HTTPS (nginx/reverse proxy)
7. Consider using a queue system for long-running generations

## Performance Notes

- **Mock Mode**: Instant response (~100ms)
- **Production Mode with GPU**:
  - 4 frames: ~30-60 seconds
  - Each additional frame: ~10-15 seconds
  
Consider adding:
- Loading indicators
- Progress updates (via WebSocket)
- Timeout handling
- Retry logic
