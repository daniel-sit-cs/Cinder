import { auth } from '../firebaseConfig';

const API_URL = 'http://192.168.68.52:8000'; 

export const generateStory = async (prompt: string, style: string, frameCount: number, refImage: string | null): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: auth.currentUser?.uid || 'temp',
        prompt,
        style,
        frameCount,
        referenceImage: refImage 
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
    return data.videoPath;
  } catch (error) {
    console.error("Animation Failed:", error);
    throw error;
  }
};