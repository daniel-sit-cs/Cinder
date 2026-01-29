// src/types/story.ts

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

export interface GenerateStoryRequest {
  userId: string;
  prompt: string;
  style?: string;
  frameCount: number;
}