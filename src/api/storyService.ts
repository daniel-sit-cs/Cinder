import { auth } from '../firebaseConfig';

// ⚠️  UPDATE THIS when switching environments:
//   Local (Replicate server.py):  'http://192.168.68.54:8000'
//   Colab (Story-Iter):           paste the ngrok URL from cinder_colab.ipynb Cell 5
const API_URL = 'https://eruciform-evalyn-nonintrospectively.ngrok-free.dev';

export const generateStory = async (prompt: string, style: string, frameCount: number, refImage: string | null): Promise<any> => {
  // Step 1: kick off the job
  const startRes = await fetch(`${API_URL}/generate-story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: auth.currentUser?.uid || 'temp',
      prompt,
      style,
      frameCount,
      referenceImage: refImage,
    }),
  });

  if (!startRes.ok) {
    const errorText = await startRes.text();
    throw new Error(`Server Error: ${errorText}`);
  }

  const { jobId } = await startRes.json();

  // Step 2: poll until done
  const POLL_INTERVAL_MS = 5000;
  const MAX_WAIT_MS = 20 * 60 * 1000; // 20 min ceiling
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollRes = await fetch(`${API_URL}/job/${jobId}`);
    if (!pollRes.ok) throw new Error(`Poll error: ${pollRes.status}`);

    const job = await pollRes.json();

    if (job.status === 'done') return job;
    if (job.status === 'error') throw new Error(`Server Error: ${job.detail}`);
    // status === 'processing' → keep polling
  }

  throw new Error('Story generation timed out after 20 minutes');
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