import { useCallback, useRef } from 'react';
import type { AvatarConfig, HairStyle, EyeStyle, Accessory } from '../types/avatar';
import { DEFAULT_LIVE_STATE } from '../types/avatar';
import type { AvatarLiveState } from '../types/avatar';
import { AvatarCanvas } from './AvatarCanvas';

interface Props {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
  { value: 'bob', label: 'Bob' },
  { value: 'twintails', label: 'Twin Tails' },
  { value: 'ponytail', label: 'Ponytail' },
];

const EYE_STYLES: { value: EyeStyle; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'almond', label: 'Almond' },
  { value: 'sleepy', label: 'Sleepy' },
];

const ACCESSORIES: { value: Accessory; label: string; emoji: string }[] = [
  { value: 'cat_ears', label: 'Cat Ears', emoji: '🐱' },
  { value: 'bunny_ears', label: 'Bunny Ears', emoji: '🐰' },
  { value: 'horns', label: 'Horns', emoji: '😈' },
  { value: 'glasses', label: 'Glasses', emoji: '👓' },
  { value: 'bow', label: 'Bow', emoji: '🎀' },
];

const OUTFIT_STYLES = [
  { value: 'idol', label: 'Idol' },
  { value: 'school', label: 'School' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'casual', label: 'Casual' },
] as const;

const PREVIEW_STATE: AvatarLiveState = {
  ...DEFAULT_LIVE_STATE,
  expression: 'happy',
  blinkLeft: 0,
  blinkRight: 0,
};

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
}

function ColorRow({ label, value, onChange, presets }: ColorRowProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-gray-400 text-sm w-28 shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
      />
      {presets && (
        <div className="flex gap-1 flex-wrap">
          {presets.map(c => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: value === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">{title}</h3>
      <div className="bg-card rounded-xl p-3 space-y-1">{children}</div>
    </div>
  );
}

export function AvatarCreator({ config, onChange }: Props) {
  const _canvasRef = useRef<HTMLCanvasElement>(null);

  const set = useCallback(<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    onChange({ ...config, [key]: value });
  }, [config, onChange]);

  const toggleAccessory = useCallback((acc: Accessory) => {
    const current = config.accessories;
    if (current.includes(acc)) {
      onChange({ ...config, accessories: current.filter(a => a !== acc) });
    } else {
      onChange({ ...config, accessories: [...current, acc] });
    }
  }, [config, onChange]);

  const handleMouseMove = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    // gaze tracking not needed in creator preview
  }, []);

  return (
    <div className="flex gap-6 h-full">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/40 ring-1 ring-white/10">
          <AvatarCanvas
            config={config}
            liveState={PREVIEW_STATE}
            width={300}
            height={375}
            onMouseMove={handleMouseMove}
          />
        </div>
        <p className="text-gray-500 text-xs">Preview (happy expression)</p>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-0 max-h-[600px] custom-scroll">
        <Section title="Skin">
          <ColorRow
            label="Skin Color"
            value={config.skinColor}
            onChange={v => set('skinColor', v)}
            presets={['#fde8d0', '#f5c99f', '#e8a87c', '#c68642', '#8d5524']}
          />
        </Section>

        <Section title="Hair">
          <div className="flex gap-2 flex-wrap mb-2">
            {HAIR_STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => set('hairStyle', s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  config.hairStyle === s.value
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ColorRow label="Hair Color" value={config.hairColor} onChange={v => set('hairColor', v)}
            presets={['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#1e3a8a', '#111827', '#f3f4f6']} />
          <ColorRow label="Highlights" value={config.hairHighlightColor} onChange={v => set('hairHighlightColor', v)}
            presets={['#a78bfa', '#f9a8d4', '#fcd34d', '#6ee7b7', '#fca5a5', '#93c5fd']} />
        </Section>

        <Section title="Eyes">
          <div className="flex gap-2 flex-wrap mb-2">
            {EYE_STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => set('eyeStyle', s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  config.eyeStyle === s.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ColorRow label="Eye Color" value={config.eyeColor} onChange={v => set('eyeColor', v)}
            presets={['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9']} />
          <ColorRow label="Eyebrow" value={config.eyebrowColor} onChange={v => set('eyebrowColor', v)} />
        </Section>

        <Section title="Outfit">
          <div className="flex gap-2 flex-wrap mb-2">
            {OUTFIT_STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => set('outfitStyle', s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  config.outfitStyle === s.value
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ColorRow label="Outfit Color" value={config.outfitColor} onChange={v => set('outfitColor', v)}
            presets={['#1e1b4b', '#831843', '#14532d', '#1c1917', '#0c4a6e', '#7f1d1d']} />
          <ColorRow label="Accent Color" value={config.accentColor} onChange={v => set('accentColor', v)}
            presets={['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']} />
        </Section>

        <Section title="Details">
          <ColorRow label="Lip Color" value={config.lipColor} onChange={v => set('lipColor', v)}
            presets={['#f472b6', '#fb7185', '#e879f9', '#c084fc']} />
          <ColorRow label="Blush Color" value={config.blushColor} onChange={v => set('blushColor', v)}
            presets={['#f9a8d4', '#fca5a5', '#fdba74', '#f0abfc']} />
        </Section>

        <Section title="Accessories">
          <div className="flex gap-2 flex-wrap">
            {ACCESSORIES.map(a => (
              <button
                key={a.value}
                onClick={() => toggleAccessory(a.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                  config.accessories.includes(a.value)
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span>{a.emoji}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Hidden canvas for potential export */}
      <canvas ref={_canvasRef} className="hidden" />
    </div>
  );
}
