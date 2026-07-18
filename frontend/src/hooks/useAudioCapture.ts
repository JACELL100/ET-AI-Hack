/**
 * Custom hook for browser audio capture via getUserMedia + MediaRecorder.
 * Used for Section 2 (WebRTC live analysis).
 *
 * NOTE: We use stop/start cycling (every 3 s) instead of
 * `MediaRecorder.start(timeslice)` because the timeslice approach
 * produces WebM fragments where only the *first* chunk carries a valid
 * EBML/WebM header.  Subsequent chunks are headerless continuations
 * that cannot be decoded independently — which causes FFmpeg / PyAV /
 * pydub on the backend to reject them with "Invalid data".
 *
 * By stopping and immediately restarting, each `ondataavailable` blob
 * is a complete, self-contained WebM file the backend can process.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export function useAudioCapture(onChunk?: (blob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const updateLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAudioLevel(avg / 255);
    animFrameRef.current = requestAnimationFrame(updateLevel);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Audio context for level metering
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      updateLevel();

      // MediaRecorder for chunked capture
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && onChunkRef.current) {
          onChunkRef.current(e.data);
        }
      };

      // Start WITHOUT timeslice — each stop() will produce a
      // complete, header-bearing WebM blob.
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Cycle stop → start every 3 s to emit complete WebM files
      chunkIntervalRef.current = setInterval(() => {
        const rec = mediaRecorderRef.current;
        if (rec && rec.state === "recording") {
          rec.stop();          // fires ondataavailable with a full WebM
          rec.start();         // immediately begin next segment
        }
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setError(msg);
      console.error("[AudioCapture]", msg);
    }
  }, [updateLevel]);

  const stop = useCallback(() => {
    // Clear the chunk cycling interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    isRecording,
    audioLevel,
    error,
    start,
    stop,
    analyserNode: analyserRef.current,
  };
}
