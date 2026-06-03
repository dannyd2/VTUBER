import { useCallback, useEffect, useRef, useState } from 'react';
import type { AvatarConfig, AvatarLiveState, Expression } from '../types/avatar';
import { DEFAULT_LIVE_STATE } from '../types/avatar';
import { AvatarCanvas } from './AvatarCanvas';
import { useMicrophoneInput } from '../hooks/useMicrophoneInput';
import { useWebcamTracking } from '../hooks/useWebcamTracking';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';
import { ParticleSystem, EXPRESSION_PARTICLES } from '../utils/particleSystem';

interface Props { config: AvatarConfig }

const EXPRESSIONS: { value: Expression; label: string; emoji: string; key: string }[] = [
  { value: 'neutral',   label: 'Neutral',   emoji: '😐', key: '1' },
  { value: 'happy',     label: 'Happy',     emoji: '😊', key: '2' },
  { value: 'sad',       label: 'Sad',       emoji: '😢', key: '3' },
  { value: 'surprised', label: 'Surprised', emoji: '😮', key: '4' },
  { value: 'angry',     label: 'Angry',     emoji: '😠', key: '5' },
  { value: 'blushing',  label: 'Blushing',  emoji: '😳', key: '6' },
  { value: 'wink',      label: 'Wink',      emoji: '😉', key: '7' },
];

const PARTICLE_CANVAS_CX = 200; // approx center x of 400px canvas
const PARTICLE_CANVAS_CY = 180; // approx head center y

export function LiveMode({ config }: Props) {
  const [liveState, setLiveState] = useState<AvatarLiveState>(DEFAULT_LIVE_STATE);
  const stateRef = useRef(liveState);
  stateRef.current = liveState;

  const mic    = useMicrophoneInput();
  const webcam = useWebcamTracking();

  // Stable particle system
  const particles = useRef(new ParticleSystem()).current;

  const getState = useCallback(() => stateRef.current, []);

  const handleStateUpdate = useCallback((s: AvatarLiveState) => {
    setLiveState(s);
    stateRef.current = s;
  }, []);

  useAvatarAnimation({
    micVolume:  mic.isActive ? mic.volume : 0,
    micViseme:  mic.viseme,
    webcamData: webcam.isActive ? webcam.data : null,
    onStateUpdate: handleStateUpdate,
    getState,
  });

  const setExpression = useCallback((expr: Expression) => {
    setLiveState(prev => {
      const next = { ...prev, prevExpression: prev.expression, expression: expr, expressionBlend: 0 };
      stateRef.current = next;
      return next;
    });
    // Emit particles
    const p = EXPRESSION_PARTICLES[expr];
    if (p) particles.emit(PARTICLE_CANVAS_CX, PARTICLE_CANVAS_CY, p.type, p.count, p.color);
  }, [particles]);

  // Mouse gaze on canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (webcam.isActive) return; // webcam drives gaze
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    setLiveState(prev => ({ ...prev, eyeGazeX: x * 0.6, eyeGazeY: y * 0.4 }));
    stateRef.current = { ...stateRef.current, eyeGazeX: x * 0.6, eyeGazeY: y * 0.4 };
  }, [webcam.isActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expr = EXPRESSIONS.find(ex => ex.key === e.key);
      if (expr) setExpression(expr.value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setExpression]);

  return (
    <div className="flex gap-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 ring-1 ring-white/10 relative">
          <AvatarCanvas
            config={config} liveState={liveState}
            width={400} height={500}
            particles={particles}
            onMouseMove={handleMouseMove}
          />
          {(mic.isActive || webcam.isActive) && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          )}
          {webcam.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
              <div className="text-white text-sm animate-pulse">Loading face tracking…</div>
            </div>
          )}
        </div>

        {/* Volume bar */}
        {mic.isActive && (
          <div className="w-full max-w-[400px]">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-none"
                style={{ width: `${mic.volume * 100}%` }} />
            </div>
            <p className="text-center text-gray-500 text-xs mt-1">
              Viseme: <span className="text-purple-400">{liveState.viseme}</span>
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 min-w-[260px]">

        {/* Webcam */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">
            Face Tracking
          </h3>
          {webcam.error && <p className="text-red-400 text-xs mb-2">{webcam.error}</p>}
          <button
            onClick={webcam.isActive ? webcam.stop : webcam.start}
            disabled={webcam.isLoading}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              webcam.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : webcam.isLoading
                ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            {webcam.isLoading ? '⏳ Loading MediaPipe…' : webcam.isActive ? '⏹ Stop Webcam' : '📷 Enable Face Tracking'}
          </button>
          {webcam.isActive && webcam.data && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-500">
              <span>Mouth: {(webcam.data.mouthOpen * 100).toFixed(0)}%</span>
              <span>Smile: {(webcam.data.smile * 100).toFixed(0)}%</span>
              <span>Blink L: {(webcam.data.blinkLeft * 100).toFixed(0)}%</span>
              <span>Blink R: {(webcam.data.blinkRight * 100).toFixed(0)}%</span>
            </div>
          )}
          {webcam.isActive && <p className="text-gray-500 text-xs mt-2">Head tilt, blinks & mouth driven by your face</p>}
        </div>

        {/* Mic */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Microphone</h3>
          {mic.error && <p className="text-red-400 text-xs mb-2">{mic.error}</p>}
          <button
            onClick={mic.isActive ? mic.stop : mic.start}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              mic.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white shadow-lg shadow-purple-600/30'
            }`}
          >
            {mic.isActive ? '⏹ Stop Mic' : '🎤 Enable Lip Sync'}
          </button>
        </div>

        {/* Expressions */}
        <div className="bg-panel rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">
            Expressions <span className="text-gray-600 normal-case font-normal">(keys 1–7)</span>
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

        {/* Head tilt (only when webcam off) */}
        {!webcam.isActive && (
          <div className="bg-panel rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">Head Tilt</h3>
            <input type="range" min={-30} max={30}
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
              <button className="text-gray-500 hover:text-gray-300 text-xs"
                onClick={() => { setLiveState(prev => ({ ...prev, headTilt: 0 })); stateRef.current = { ...stateRef.current, headTilt: 0 }; }}>
                Reset
              </button>
              <span>Right →</span>
            </div>
          </div>
        )}

        {!webcam.isActive && (
          <div className="bg-panel rounded-xl p-3">
            <p className="text-gray-500 text-xs">Move mouse over avatar to control eye gaze</p>
          </div>
        )}
      </div>
    </div>
  );
}
