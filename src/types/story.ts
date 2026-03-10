// src/types/story.ts

export interface Frame {
  index: number;
  narration: string;     // Generated text
  imageUrl: string;      // Base64-encoded image
}

export interface GenerateStoryResponse {
  status: string;
  storyId: string;
  frames: Frame[];
  videoUrl?: string;     // Single compiled cinematic video
}

export interface GenerateStoryRequest {
  userId: string;
  prompt: string;
  style?: string;
  frameCount: number;
}