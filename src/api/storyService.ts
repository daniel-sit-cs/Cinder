// src/api/storyService.ts

// Make sure this points to your computer's IP address if testing on a physical phone,
// or localhost/10.0.2.2 if using an emulator.
const API_URL = 'http://localhost:8000'; // Update this if needed!

// 1. Updated to accept prompt, style, AND frameCount
export const generateStory = async (prompt: string, style: string, frameCount: number): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: 'temp-user', // We will update this to Firebase real user later
        prompt: prompt,
        style: style,
        frameCount: frameCount 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Story Generation Failed:", error);
    throw error;
  }
};

// 2. Updated to accept imageUrl AND narration (for the TTS Audio)
export const animateFrame = async (imageUrl: string, narration: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/animate-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl: imageUrl, 
        narration: narration 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${errorText}`);
    }

    const data = await response.json();
    return `${API_URL}/videos/${data.filename}`;

  } catch (error) {
    console.error("Animation Failed:", error);
    throw error;
  }
};