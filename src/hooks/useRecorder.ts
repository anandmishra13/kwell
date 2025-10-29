import { useState, useRef } from 'react';
import { api } from '../services/apiService';
import { logEvent } from '../services/AnalyticsService';

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ emotion: string; confidence: number } | null>(null);

  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    setResult(null);
    logEvent('record_start');
    setRecording(true);
    setSecondsLeft(5);
    let sec = 5;
    timerRef.current = setInterval(() => {
      sec -= 1;
      setSecondsLeft(sec);
      if (sec <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        stopRecording();
      }
    }, 1000) as unknown as number;
  };

  const stopRecording = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
    setProcessing(true);
    logEvent('record_stop');

    // Simulate upload
    const upload = await api.uploadAudio(null);
    // request analysis
    const analysis = await api.analyzeAudio(upload.id);
    setProcessing(false);
    setResult(analysis);
    logEvent('record_result', analysis);
  };

  return { recording, secondsLeft, processing, result, startRecording, stopRecording };
}