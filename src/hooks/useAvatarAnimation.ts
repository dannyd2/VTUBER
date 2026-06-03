import { useEffect, useRef, useCallback } from 'react';
import type { AvatarLiveState, Expression, Viseme } from '../types/avatar';
import type { FaceTrackingData } from './useWebcamTracking';

interface AnimationOptions {
  micVolume: number;
  micViseme: Viseme;
  webcamData: FaceTrackingData | null;
  onStateUpdate: (state: AvatarLiveState) => void;
  getState: () => AvatarLiveState;
  autoExpression?: boolean;
}

function detectExpression(cam: FaceTrackingData): Expression | null {
  if (cam.smile > 0.55) return 'happy';
  if (cam.browRaise > 0.65 && cam.mouthOpen > 0.3) return 'surprised';
  if (cam.browFurrow > 0.6 && cam.smile < 0.1) return 'angry';
  if (cam.smile > 0.35 && cam.blinkLeft < 0.3 && cam.smile < 0.55) return 'blushing';
  return null;
}

const BLINK_TRANSITION = 0.08;
const EXPRESSION_TRANSITION = 0.06;
// React state updates throttled to ~15fps; renderer reads the hot ref at 60fps
const UI_UPDATE_MS = 66;

export function useAvatarAnimation({ micVolume, micViseme, webcamData, onStateUpdate, getState, autoExpression = false }: AnimationOptions) {
  const rafRef = useRef<number>(0);
  const micVolumeRef  = useRef(micVolume);
  const micVisemeRef  = useRef(micViseme);
  const webcamDataRef = useRef(webcamData);
  micVolumeRef.current  = micVolume;
  micVisemeRef.current  = micViseme;
  webcamDataRef.current = webcamData;

  const autoExpressionRef = useRef(autoExpression);
  autoExpressionRef.current = autoExpression;

  const blinkRef = useRef({
    nextBlink: Date.now() + 2000 + Math.random() * 3000,
    blinking: false,
    phase: 0,
    timer: 0,
  });

  // Hot ref updated every 60fps frame — renderer reads this directly
  const liveRef = useRef<AvatarLiveState>(getState());
  const lastExprRef        = useRef<Expression>(getState().expression);
  const lastReactUpdateRef = useRef(0);

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
    const headRotX    = cam ? cam.headRotX    : (state.headRotX ?? 0);
    const headRotY    = cam ? cam.headRotY    : (state.headRotY ?? 0);
    const tongueOut   = cam ? cam.tongueOut   : 0;

    // ── Auto-expression detection ─────────────────────────────────────────
    let expression      = state.expression;
    let prevExpression  = state.prevExpression;
    let finalExprBlend  = expressionBlend;

    if (autoExpressionRef.current && cam) {
      const autoExpr = detectExpression(cam);
      if (autoExpr && autoExpr !== state.expression) {
        if (state.expressionBlend >= 0.9) {
          prevExpression = state.expression;
          expression     = autoExpr;
          finalExprBlend = 0;
        }
      }
    }

    const newState: AvatarLiveState = {
      ...state,
      expression,
      prevExpression,
      expressionBlend: finalExprBlend,
      blinkLeft,
      blinkRight,
      breathPhase,
      mouthOpen,
      viseme,
      eyeGazeX,
      eyeGazeY,
      headTilt,
      headRotX,
      headRotY,
      tongueOut,
    };

    // Always update hot ref — Three.js renderer reads this at full 60fps
    liveRef.current = newState;

    // Throttle React state updates to ~15fps; always push on expression change
    const exprChanged = expression !== lastExprRef.current;
    lastExprRef.current = expression;
    if (exprChanged || now - lastReactUpdateRef.current > UI_UPDATE_MS) {
      lastReactUpdateRef.current = now;
      onStateUpdate(newState);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [getState, onStateUpdate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return { liveRef };
}
