// src/api/storyService.ts
import { auth } from '../firebaseConfig';
import { GenerateStoryResponse } from '../types/story';
import { Platform } from 'react-native';

// ⚠️ CRITICAL: Replace '192.168.x.x' with YOUR computer's actual IP address.
// On Windows, run 'ipconfig' in cmd to find it (IPv4 Address).
// If using Android Emulator, you can try 'http://10.0.2.2:8000'.
const LOCAL_IP = '192.168.68.56'; // <--- CHANGE THIS

const API_BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : `http://${LOCAL_IP}:8000`)
  : 'https://your-production-url.com';

export const generateStory = async (
  prompt: string, 
  style: string = "storybook",
  frameCount: number = 4
): Promise<GenerateStoryResponse> => {
  
  const currentUser = auth.currentUser;
  
  try {
    console.log(`📡 Connecting to Backend at: ${API_BASE_URL}`);

    const response = await fetch(`${API_BASE_URL}/generate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUser?.uid || "guest", // Handle guest users if needed
        prompt,
        style,
        frameCount
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error (${response.status}): ${errorText}`);
    }

    const data: GenerateStoryResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error("❌ Generation Failed:", error);
    throw error;
  }
};