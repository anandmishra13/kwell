import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.example.com', // replace with real base later
  timeout: 10000,
});

export type Product = { id: string; displayName: string; displayPrice: string };
export type UploadResponse = { audioUrl: string; id: string };
export type EmotionResult = { emotion: string; confidence: number };

export const api = {
  async fetchProducts(): Promise<Product[]> {
    // Simulated API - replace with real call
    await new Promise((r) => setTimeout(r, 1400));
    return [
      { id: 'monthly', displayName: 'Monthly', displayPrice: '₹199 / mo' },
      { id: 'yearly', displayName: 'Yearly', displayPrice: '₹999 / yr' }
    ];
  },

  async uploadAudio(blob: any): Promise<UploadResponse> {
    // Simulate upload
    await new Promise((r) => setTimeout(r, 1000));
    return { audioUrl: 'https://cdn.example.com/audio/fakefile.wav', id: 'fake-audio-id' };
  },

  async analyzeAudio(audioId: string): Promise<EmotionResult> {
    // Simulate analysis delay and random result
    await new Promise((r) => setTimeout(r, 1800));
    const emotions = ['Joy', 'Sadness', 'Anger', 'Neutral', 'Anxious', 'Calm'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = +(Math.random() * 0.3 + 0.7).toFixed(2);
    return { emotion, confidence };
  }
};

export default client;