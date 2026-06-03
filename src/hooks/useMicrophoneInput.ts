import { useEffect, useRef, useState, useCallback } from 'react';
import { VisemeAnalyzer } from '../utils/visemeAnalyzer';
import type { Viseme } from '../types/avatar';

export function useMicrophoneInput() {
  const [volume, setVolume] = useState(0);
  const [viseme, setViseme] = useState<Viseme>('rest');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const analyzerRef   = useRef<VisemeAnalyzer | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const prevVolRef    = useRef(0);
  const prevVisemeRef = useRef<Viseme>('rest');

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      analyzerRef.current = new VisemeAnalyzer(analyser);
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      setIsActive(true);
      setError(null);

      const tick = () => {
        const result = analyzerRef.current?.analyze();
        if (result) {
          if (Math.abs(result.volume - prevVolRef.current) > 0.004) {
            prevVolRef.current = result.volume;
            setVolume(result.volume);
          }
          if (result.viseme !== prevVisemeRef.current) {
            prevVisemeRef.current = result.viseme;
            setViseme(result.viseme);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Microphone access denied');
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    analyzerRef.current = null;
    streamRef.current = null;
    prevVolRef.current    = 0;
    prevVisemeRef.current = 'rest';
    setIsActive(false);
    setVolume(0);
    setViseme('rest');
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { volume, viseme, isActive, error, start, stop };
}
