import { useCallback, useEffect, useRef, useState } from 'react';
import type { AvatarConfig, AvatarLiveState, Expression } from '../types/avatar';
import { AvatarCanvas } from './AvatarCanvas';
import { useMicrophoneInput } from '../hooks/useMicrophoneInput';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

interface Props {
  config: AvatarConfig;
}

const EXPRESSIONS: { value: Expression; label: string; emoji: string; key: string }[] = [
  { value: 'neutral', label: 'Neutral', emoji: '😐', key: '1' },
  { value: 'happy', label: 'Happy', emoji: '😊', key: '2' },
  { value: 'sad', label: 'Sad', emoji: '😢', key: '3' },
  { value: 'surprised', label: 'Surprised', emoji: '😮', key: '4' },
  { value: 'angry', label: 'Angry', emoji: '😠', key: '5' },
  { value: 'blushing', label: 'Blushing', emoji: '😳', key: '6' },
  { value: 'wink', label: 'Wink', emoji: '😉', key: '7' },
];

export function LiveMode({ config }: Props) {
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

  const setExpression = useCallback((expr: Expression) => {
    setLiveState(prev => ({ ...prev, expression: expr }));
    stateRef.current = { ...stateRef.current, expression: expr };
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setLiveState(prev => ({ ...prev, eyeGazeX: x * 0.6, eyeGazeY: y * 0.4 }));
    stateRef.current = { ...stateRef.current, eyeGazeX: x * 0.6, eyeGazeY: y * 0.4 };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const expr = EXPRESSIONS.find(ex => ex.key === e.key);
    if (expr) setExpression(expr.value);
  }, [setExpression]);

  // Keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex gap-6 h-full">
      {/* Avatar display */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 ring-1 ring-white/10 relative"
          style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0d2e)' }}
        >
          <AvatarCanvas
            config={config}
            liveState={liveState}
            width={400}
            height={500}
            onMouseMove={handleCanvasMouseMove}
          />

          {/* Mic indicator */}
          {mic.isActive && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"
                style={{ transform: `scale(${1 + mic.volume * 1.5})` }}
              />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          )}
        </div>

        {/* Mic volume bar */}
        {mic.isActive && (
          <div className="w-full max-w-[400px]">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75"
                style={{ width: `${mic.volume * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-5 min-w-[260px]">
        {/* Mic control */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Microphone</h3>
          {mic.error && <p className="text-red-400 text-xs mb-2">{mic.error}</p>}
          <button
            onClick={mic.isActive ? mic.stop : mic.start}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              mic.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/30'
            }`}
          >
            {mic.isActive ? (
              <><span>⏹</span><span>Stop Microphone</span></>
            ) : (
              <><span>🎤</span><span>Enable Lip Sync</span></>
            )}
          </button>
          {mic.isActive && (
            <p className="text-gray-500 text-xs mt-2 text-center">Mouth moves with your voice</p>
          )}
        </div>

        {/* Expressions */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">
            Expressions <span className="text-gray-600 normal-case">(keys 1–7)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {EXPRESSIONS.map(expr => (
              <button
                key={expr.value}
                onClick={() => setExpression(expr.value)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  liveState.expression === expr.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{expr.emoji}</span>
                <span>{expr.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Head tilt */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Head Tilt</h3>
          <input
            type="range"
            min={-30}
            max={30}
            value={Math.round((liveState.headTilt * 180) / Math.PI)}
            onChange={e => {
              const rad = (parseInt(e.target.value) * Math.PI) / 180;
              setLiveState(prev => ({ ...prev, headTilt: rad }));
              stateRef.current = { ...stateRef.current, headTilt: rad };
            }}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-gray-500 text-xs mt-1">
            <span>← Left</span>
            <button
              className="text-gray-500 hover:text-gray-300 text-xs"
              onClick={() => {
                setLiveState(prev => ({ ...prev, headTilt: 0 }));
                stateRef.current = { ...stateRef.current, headTilt: 0 };
              }}
            >
              Reset
            </button>
            <span>Right →</span>
          </div>
        </div>

        {/* Shortcuts legend */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">Mouse Tracking</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            Move your mouse over the avatar — the eyes will follow the cursor.
          </p>
        </div>
      </div>
    </div>
  );
}
