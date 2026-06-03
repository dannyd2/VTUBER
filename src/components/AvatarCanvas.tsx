import { useEffect, useRef, useCallback } from 'react';
import type { AvatarConfig, AvatarLiveState } from '../types/avatar';
import { AvatarRenderer } from '../utils/avatarRenderer';

interface Props {
  config: AvatarConfig;
  liveState: AvatarLiveState;
  transparent?: boolean;
  className?: string;
  width?: number;
  height?: number;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export function AvatarCanvas({ config, liveState, transparent = false, className, width = 400, height = 500, onMouseMove }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AvatarRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new AvatarRenderer(canvas);
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.render(config, liveState, transparent);
  }, [config, liveState, transparent]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    onMouseMove?.(e);
  }, [onMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseMove={handleMouseMove}
    />
  );
}
