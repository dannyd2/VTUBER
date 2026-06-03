import { useCallback, useRef, useState } from 'react';
import type { AvatarConfig, AvatarLiveState, Expression } from '../types/avatar';
import { AvatarCanvas } from './AvatarCanvas';
import { useMicrophoneInput } from '../hooks/useMicrophoneInput';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';
import { useEffect } from 'react';

interface Props {
  config: AvatarConfig;
}

const EXPRESSIONS: { value: Expression; key: string }[] = [
  { value: 'neutral', key: '1' },
  { value: 'happy', key: '2' },
  { value: 'sad', key: '3' },
  { value: 'surprised', key: '4' },
  { value: 'angry', key: '5' },
  { value: 'blushing', key: '6' },
  { value: 'wink', key: '7' },
];

type BgMode = 'transparent' | 'green' | 'blue' | 'dark';

const BG_OPTIONS: { value: BgMode; label: string; color: string }[] = [
  { value: 'transparent', label: 'Transparent', color: 'transparent' },
  { value: 'green', label: 'Green Screen', color: '#00ff00' },
  { value: 'blue', label: 'Blue Screen', color: '#0000ff' },
  { value: 'dark', label: 'Dark', color: '#0f0f1a' },
];

export function StreamMode({ config }: Props) {
  const [liveState, setLiveState] = useState<AvatarLiveState>({
    expression: 'neutral',
    mouthOpen: 0,
    blinkLeft: 0,
    blinkRight: 0,
    eyeGazeX: 0,
    eyeGazeY: 0,
    headTilt: 0,
    breathPhase: 0,
    isMicActive: false,
  });
  const [bgMode, setBgMode] = useState<BgMode>('transparent');

  const stateRef = useRef(liveState);
  stateRef.current = liveState;
  const mic = useMicrophoneInput();

  const getState = useCallback(() => stateRef.current, []);
  const handleStateUpdate = useCallback((s: AvatarLiveState) => {
    setLiveState(s);
    stateRef.current = s;
  }, []);

  useAvatarAnimation({
    micVolume: mic.isActive ? mic.volume : 0,
    onStateUpdate: handleStateUpdate,
    getState,
  });

  // Keyboard shortcuts for expressions
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expr = EXPRESSIONS.find(ex => ex.key === e.key);
      if (expr) {
        setLiveState(prev => ({ ...prev, expression: expr.value }));
        stateRef.current = { ...stateRef.current, expression: expr.value };
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isTransparent = bgMode === 'transparent';

  return (
    <div className="flex gap-6">
      {/* Stream canvas area */}
      <div className="flex flex-col gap-3">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative"
          style={{
            background: isTransparent
              ? 'repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 0 0 / 16px 16px'
              : BG_OPTIONS.find(b => b.value === bgMode)?.color,
          }}
        >
          <AvatarCanvas
            config={config}
            liveState={liveState}
            transparent={isTransparent}
            width={450}
            height={560}
          />
        </div>

        <p className="text-gray-500 text-xs text-center">
          Add this window to OBS as a Window Capture, or use{' '}
          <span className="text-purple-400">transparent</span> mode with a browser source.
        </p>
      </div>

      {/* Stream controls */}
      <div className="flex flex-col gap-4 min-w-[240px]">
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Background</h3>
          <div className="grid grid-cols-2 gap-2">
            {BG_OPTIONS.map(bg => (
              <button
                key={bg.value}
                onClick={() => setBgMode(bg.value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  bgMode === bg.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span
                  className="w-4 h-4 rounded border border-white/20"
                  style={{
                    background: bg.value === 'transparent'
                      ? 'repeating-conic-gradient(#888 0% 25%, #555 0% 50%) 0 0 / 8px 8px'
                      : bg.color
                  }}
                />
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Microphone</h3>
          <button
            onClick={mic.isActive ? mic.stop : mic.start}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              mic.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white'
            }`}
          >
            {mic.isActive ? '⏹ Stop Mic' : '🎤 Enable Lip Sync'}
          </button>
          {mic.isActive && (
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75"
                style={{ width: `${mic.volume * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Shortcuts</h3>
          <div className="space-y-1">
            {['1 Neutral', '2 Happy', '3 Sad', '4 Surprised', '5 Angry', '6 Blushing', '7 Wink'].map(s => {
              const [key, ...rest] = s.split(' ');
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <kbd className="bg-white/10 text-gray-300 rounded px-2 py-0.5 font-mono text-xs">{key}</kbd>
                  <span className="text-gray-400">{rest.join(' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">OBS Setup</h3>
          <ol className="text-gray-400 text-xs space-y-1.5 list-none">
            <li className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">1.</span> Open OBS → Add Source</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">2.</span> Choose "Browser Source"</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">3.</span> Set URL to this page's address</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">4.</span> Enable "Allow Transparency"</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">5.</span> Set background to Transparent ↑</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
