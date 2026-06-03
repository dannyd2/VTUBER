import { useCallback, useEffect, useRef, useState } from 'react';
import type { AvatarConfig, AvatarLiveState, Expression, BackgroundStyle } from '../types/avatar';
import { DEFAULT_LIVE_STATE } from '../types/avatar';
import { Avatar3DCanvas } from './Avatar3DCanvas';
import { useMicrophoneInput } from '../hooks/useMicrophoneInput';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

interface Props { config: AvatarConfig }

const EXPRESSIONS: { value: Expression; key: string }[] = [
  { value: 'neutral', key: '1' }, { value: 'happy', key: '2' },
  { value: 'sad', key: '3' },     { value: 'surprised', key: '4' },
  { value: 'angry', key: '5' },   { value: 'blushing', key: '6' },
  { value: 'wink', key: '7' },
];

type ChromaKey = 'transparent' | 'green' | 'blue';

const CHROMA: { value: ChromaKey; label: string; bg: string }[] = [
  { value: 'transparent', label: 'Transparent', bg: '' },
  { value: 'green',       label: 'Green Screen', bg: '#00ff00' },
  { value: 'blue',        label: 'Blue Screen',  bg: '#0000ff' },
];

const BG_STYLES: { value: BackgroundStyle; label: string; emoji: string }[] = [
  { value: 'none',        label: 'None',        emoji: '⬛' },
  { value: 'stars',       label: 'Stars',       emoji: '⭐' },
  { value: 'sakura',      label: 'Sakura',      emoji: '🌸' },
  { value: 'gradient',    label: 'Gradient',    emoji: '🌈' },
  { value: 'holographic', label: 'Holo',        emoji: '💿' },
  { value: 'rain',        label: 'Rain',        emoji: '🌧' },
];

export function StreamMode({ config }: Props) {
  const [liveState, setLiveState] = useState<AvatarLiveState>(DEFAULT_LIVE_STATE);
  const [chromaKey, setChromaKey] = useState<ChromaKey>('transparent');
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('stars');
  const [scale, setScale] = useState(1);
  const stateRef = useRef(liveState);
  stateRef.current = liveState;

  const mic = useMicrophoneInput();

  const getState = useCallback(() => stateRef.current, []);
  const handleStateUpdate = useCallback((s: AvatarLiveState) => {
    setLiveState(s);
    stateRef.current = s;
  }, []);

  useAvatarAnimation({
    micVolume:  mic.isActive ? mic.volume : 0,
    micViseme:  mic.viseme,
    webcamData: null,
    onStateUpdate: handleStateUpdate,
    getState,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expr = EXPRESSIONS.find(ex => ex.key === e.key);
      if (expr) {
        const { value } = expr;
        setLiveState(prev => {
          const next = { ...prev, prevExpression: prev.expression, expression: value, expressionBlend: 0 };
          stateRef.current = next;
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const exportPNG = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#stream-canvas canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'vtuber-avatar.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const isTransparent = chromaKey === 'transparent' && bgStyle === 'none';
  const chromaBg = chromaKey !== 'transparent' ? CHROMA.find(c => c.value === chromaKey)?.bg ?? '' : '';

  return (
    <div className="flex gap-6">
      {/* Stream canvas */}
      <div className="flex flex-col gap-3">
        <div
          id="stream-canvas"
          className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative"
          style={{
            background: chromaBg || (isTransparent
              ? 'repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 0 0 / 16px 16px'
              : undefined),
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Avatar3DCanvas
            config={{ ...config, background: bgStyle }}
            liveState={liveState}
            width={450}
            height={560}
            handLandmarks={null}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={exportPNG}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-600/30">
            📷 Export PNG
          </button>
          <div className="flex items-center gap-2 bg-panel rounded-lg px-3">
            <span className="text-gray-400 text-xs">Scale</span>
            <input type="range" min={50} max={150} value={Math.round(scale * 100)}
              onChange={e => setScale(parseInt(e.target.value) / 100)}
              className="w-16 accent-purple-500" />
            <span className="text-gray-400 text-xs w-8">{Math.round(scale * 100)}%</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs text-center">
          Add as Browser Source in OBS • Enable Transparency • Keys 1–7 for expressions
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 min-w-[240px]">

        {/* Background */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Background</h3>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {BG_STYLES.map(bg => (
              <button key={bg.value} onClick={() => setBgStyle(bg.value)}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                  bgStyle === bg.value ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="text-base">{bg.emoji}</span>
                <span>{bg.label}</span>
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mb-2">Chroma key</p>
          <div className="flex gap-2">
            {CHROMA.map(c => (
              <button key={c.value} onClick={() => setChromaKey(c.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  chromaKey === c.value ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mic */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Microphone</h3>
          <button onClick={mic.isActive ? mic.stop : mic.start}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              mic.isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white'
            }`}
          >
            {mic.isActive ? '⏹ Stop Mic' : '🎤 Enable Lip Sync'}
          </button>
          {mic.isActive && (
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-none"
                style={{ width: `${mic.volume * 100}%` }} />
            </div>
          )}
        </div>

        {/* OBS instructions */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">OBS Setup</h3>
          <ol className="text-gray-400 text-xs space-y-1.5">
            {[
              'Add Source → Browser Source',
              'URL: this page\'s address',
              'Size: 450 × 560',
              'Enable "Allow Transparency"',
              'Set Chroma/BG above → Transparent',
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Shortcuts */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">Shortcuts</h3>
          <div className="grid grid-cols-2 gap-y-1 gap-x-3">
            {['1 Neutral','2 Happy','3 Sad','4 Surprised','5 Angry','6 Blushing','7 Wink'].map(s => {
              const [k, ...rest] = s.split(' ');
              return (
                <div key={k} className="flex items-center gap-1.5 text-xs">
                  <kbd className="bg-white/10 text-gray-300 rounded px-1.5 py-0.5 font-mono">{k}</kbd>
                  <span className="text-gray-400">{rest.join(' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
