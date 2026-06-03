import { useEffect, useRef, useCallback } from 'react';
import type { AvatarLiveState } from '../types/avatar';

interface AnimationOptions {
  micVolume: number;
  onStateUpdate: (state: AvatarLiveState) => void;
  getState: () => AvatarLiveState;
}

export function useAvatarAnimation({ micVolume, onStateUpdate, getState }: AnimationOptions) {
  const rafRef = useRef<number>(0);
  const micVolumeRef = useRef(micVolume);
  micVolumeRef.current = micVolume;

  // Blink state machine
  const blinkRef = useRef({
    nextBlink: Date.now() + 2000 + Math.random() * 3000,
    blinking: false,
    phase: 0, // 0=opening, 1=closing
    timer: 0,
  });

  const tick = useCallback(() => {
    const now = Date.now();
    const state = getState();
    const blink = blinkRef.current;

    let blinkLeft = state.blinkLeft;
    let blinkRight = state.blinkRight;

    // Blink logic
    if (!blink.blinking && now >= blink.nextBlink) {
      blink.blinking = true;
      blink.phase = 0; // closing
      blink.timer = now;
    }
    if (blink.blinking) {
      const elapsed = now - blink.timer;
      if (blink.phase === 0) {
        // Closing: ~80ms
        const t = Math.min(1, elapsed / 80);
        blinkLeft = blinkRight = t;
        if (t >= 1) { blink.phase = 1; blink.timer = now; }
      } else {
        // Opening: ~120ms
        const t = Math.min(1, elapsed / 120);
        blinkLeft = blinkRight = 1 - t;
        if (t >= 1) {
          blink.blinking = false;
          blinkLeft = blinkRight = 0;
          blink.nextBlink = now + 2500 + Math.random() * 4000;
        }
      }
    }

    // Breathing
    const breathPhase = (now / 1800) % (Math.PI * 2);

    // Smooth mouth open toward mic volume
    const targetMouth = micVolumeRef.current;
    const mouthOpen = state.mouthOpen * 0.65 + targetMouth * 0.35;

    onStateUpdate({
      ...state,
      blinkLeft,
      blinkRight,
      breathPhase,
      mouthOpen,
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [getState, onStateUpdate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);
}
