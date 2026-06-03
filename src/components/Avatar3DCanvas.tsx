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

export function Avatar3DCanvas({ config, liveState, width, height, handLandmarks }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Avatar3DRenderer | null>(null);
  const rafRef      = useRef<number>(0);

  const configRef = useRef(config);
  const stateRef  = useRef(liveState);
  const handsRef  = useRef(handLandmarks ?? null);
  configRef.current = config;
  stateRef.current  = liveState;
  handsRef.current  = handLandmarks ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new Avatar3DRenderer(canvas);

    const frame = () => {
      rendererRef.current?.render(configRef.current, stateRef.current, handsRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
}
