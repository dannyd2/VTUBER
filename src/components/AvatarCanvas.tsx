import { useEffect, useRef } from 'react';
import type { AvatarConfig, AvatarLiveState, BackgroundStyle } from '../types/avatar';
import { AvatarRenderer } from '../utils/avatarRenderer';
import { BackgroundRenderer } from '../utils/backgroundRenderer';
import type { ParticleSystem } from '../utils/particleSystem';

interface Props {
  config: AvatarConfig;
  liveState: AvatarLiveState;
  transparent?: boolean;
  backgroundStyle?: BackgroundStyle;
  particles?: ParticleSystem;
  className?: string;
  width?: number;
  height?: number;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export function AvatarCanvas({
  config, liveState, transparent = false,
  backgroundStyle = 'none', particles,
  className, width = 400, height = 500, onMouseMove,
}: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const avatarRef    = useRef<AvatarRenderer | null>(null);
  const bgRef        = useRef<BackgroundRenderer | null>(null);
  const configRef    = useRef(config);
  const stateRef     = useRef(liveState);
  const bgStyleRef   = useRef(backgroundStyle);
  const transparentRef = useRef(transparent);
  const particlesRef = useRef(particles);

  configRef.current      = config;
  stateRef.current       = liveState;
  bgStyleRef.current     = backgroundStyle;
  transparentRef.current = transparent;
  particlesRef.current   = particles;

  // Initialize renderers and start own RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    avatarRef.current = new AvatarRenderer(canvas);
    bgRef.current = new BackgroundRenderer(canvas.width, canvas.height);

    let rafId: number;
    const frame = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (transparentRef.current || bgStyleRef.current === 'none') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Background
      if (bgStyleRef.current !== 'none') {
        bgRef.current?.render(ctx, bgStyleRef.current);
      }

      // Avatar
      avatarRef.current?.render(configRef.current, stateRef.current, transparentRef.current && bgStyleRef.current === 'none');

      // Particles
      if (particlesRef.current) {
        particlesRef.current.update();
        particlesRef.current.render(ctx);
      }

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []); // runs once — everything else via refs

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseMove={onMouseMove}
      style={{ display: 'block' }}
    />
  );
}
