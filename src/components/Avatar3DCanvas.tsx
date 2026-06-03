import { useEffect, useRef } from 'react';
import type { AvatarConfig, AvatarLiveState } from '../types/avatar';
import { Avatar3DRenderer } from '../utils/avatar3DRenderer';

interface Props {
  config: AvatarConfig;
  liveState: AvatarLiveState;
  width: number;
  height: number;
  handLandmarks?: Array<{ x: number; y: number; z: number }[]> | null;
}

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
] as const;

export function Avatar3DCanvas({ config, liveState, width, height, handLandmarks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Avatar3DRenderer | null>(null);
  const rafRef = useRef<number>(0);

  const configRef = useRef(config);
  const stateRef  = useRef(liveState);
  configRef.current = config;
  stateRef.current  = liveState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new Avatar3DRenderer(canvas);

    const frame = () => {
      rendererRef.current?.render(configRef.current, stateRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Draw hand skeleton overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!handLandmarks?.length) return;

    for (const hand of handLandmarks) {
      ctx.strokeStyle = 'rgba(100, 210, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const [a, b] of HAND_CONNECTIONS) {
        if (a >= hand.length || b >= hand.length) continue;
        ctx.beginPath();
        ctx.moveTo(hand[a].x * width, hand[a].y * height);
        ctx.lineTo(hand[b].x * width, hand[b].y * height);
        ctx.stroke();
      }
      for (const pt of hand) {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 210, 80, 0.9)';
        ctx.fill();
      }
    }
  }, [handLandmarks, width, height]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}
