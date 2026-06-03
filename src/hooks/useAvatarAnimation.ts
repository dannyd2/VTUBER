import { useEffect, useRef, useCallback } from 'react';
import type { AvatarLiveState, Viseme } from '../types/avatar';
import type { FaceTrackingData } from './useWebcamTracking';

interface AnimationOptions {
  micVolume: number;
  micViseme: Viseme;
  webcamData: FaceTrackingData | null;
  onStateUpdate: (state: AvatarLiveState) => void;
  getState: () => AvatarLiveState;
}

const BLINK_TRANSITION = 0.08;
const EXPRESSION_TRANSITION = 0.06;

export function useAvatarAnimation({ micVolume, micViseme, webcamData, onStateUpdate, getState }: AnimationOptions) {
  const rafRef = useRef<number>(0);
  const micVolumeRef  = useRef(micVolume);
  const micVisemeRef  = useRef(micViseme);
  const webcamDataRef = useRef(webcamData);
  micVolumeRef.current  = micVolume;
  micVisemeRef.current  = micViseme;
  webcamDataRef.current = webcamData;

  const blinkRef = useRef({
    nextBlink: Date.now() + 2000 + Math.random() * 3000,
    blinking: false,
    phase: 0,
    timer: 0,
  });

  const tick = useCallback(() => {
    const now = Date.now();
    const state = getState();
    const blink = blinkRef.current;
    const cam = webcamDataRef.current;

    // ── Expression blend ──────────────────────────────────────────────────
    const expressionBlend = Math.min(1, state.expressionBlend + EXPRESSION_TRANSITION);

    // ── Blink (skip if webcam is active — webcam provides blinks) ─────────
    let blinkLeft  = cam ? Math.min(1, cam.blinkLeft * 1.4) : state.blinkLeft;
    let blinkRight = cam ? Math.min(1, cam.blinkRight * 1.4) : state.blinkRight;

    if (!cam) {
      if (!blink.blinking && now >= blink.nextBlink) {
        blink.blinking = true;
        blink.phase = 0;
        blink.timer = now;
      }
      if (blink.blinking) {
        const elapsed = now - blink.timer;
        if (blink.phase === 0) {
          const t = Math.min(1, elapsed / 80);
          blinkLeft = blinkRight = t;
          if (t >= 1) { blink.phase = 1; blink.timer = now; }
        } else {
          const t = Math.min(1, elapsed / 120);
          blinkLeft = blinkRight = 1 - t;
          if (t >= 1) {
            blink.blinking = false;
            blinkLeft = blinkRight = 0;
            blink.nextBlink = now + 2500 + Math.random() * 4000;
          }
        }
      }
    }

    // ── Breathing ─────────────────────────────────────────────────────────
    const breathPhase = (now / 1800) % (Math.PI * 2);

    // ── Mouth / gaze / head from webcam or mic ────────────────────────────
    const mouthOpen   = cam ? cam.mouthOpen * 0.9 : state.mouthOpen * (1 - BLINK_TRANSITION) + micVolumeRef.current * BLINK_TRANSITION;
    const viseme      = cam ? 'aa' as const : (micVolumeRef.current > 0.05 ? micVisemeRef.current : 'rest' as const);
    const eyeGazeX    = cam ? cam.eyeGazeX   : state.eyeGazeX;
    const eyeGazeY    = cam ? cam.eyeGazeY   : state.eyeGazeY;
    const headTilt    = cam ? cam.headTilt    : state.headTilt;

    onStateUpdate({
      ...state,
      expressionBlend,
      blinkLeft,
      blinkRight,
      breathPhase,
      mouthOpen,
      viseme,
      eyeGazeX,
      eyeGazeY,
      headTilt,
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [getState, onStateUpdate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);
}
