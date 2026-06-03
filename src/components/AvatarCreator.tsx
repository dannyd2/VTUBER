import { useCallback } from 'react';
import type { AvatarConfig, AvatarLiveState, HairStyle, EyeStyle, Accessory, BonusAccessory, SkinMarking, EyeDecoration } from '../types/avatar';
import { DEFAULT_LIVE_STATE } from '../types/avatar';
import { Avatar3DCanvas } from './Avatar3DCanvas';

interface Props {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

const PREVIEW_STATE: AvatarLiveState = { ...DEFAULT_LIVE_STATE, expression: 'happy', expressionBlend: 1, headRotX: 0, headRotY: 0, tongueOut: 0 };

const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: 'long', label: 'Long' }, { value: 'short', label: 'Short' },
  { value: 'bob', label: 'Bob' }, { value: 'twintails', label: 'Twin Tails' }, { value: 'ponytail', label: 'Ponytail' },
];
const EYE_STYLES: { value: EyeStyle; label: string }[] = [
  { value: 'round', label: 'Round' }, { value: 'almond', label: 'Almond' }, { value: 'sleepy', label: 'Sleepy' },
];
const EYE_DECOS: { value: EyeDecoration; label: string }[] = [
  { value: 'normal', label: 'Normal' }, { value: 'sparkle', label: 'Sparkle ✨' },
  { value: 'star', label: 'Star ⭐' }, { value: 'heart', label: 'Heart 💜' },
];
const ACCESSORIES: { value: Accessory; emoji: string; label: string }[] = [
  { value: 'cat_ears', emoji: '🐱', label: 'Cat Ears' },
  { value: 'bunny_ears', emoji: '🐰', label: 'Bunny Ears' },
  { value: 'horns', emoji: '😈', label: 'Horns' },
  { value: 'glasses', emoji: '👓', label: 'Glasses' },
  { value: 'bow', emoji: '🎀', label: 'Bow' },
];
const BONUS_ACCS: { value: BonusAccessory; emoji: string; label: string }[] = [
  { value: 'wings', emoji: '🦋', label: 'Wings' },
  { value: 'tail', emoji: '🦊', label: 'Tail' },
  { value: 'flower_crown', emoji: '🌸', label: 'Flowers' },
  { value: 'headphones', emoji: '🎧', label: 'Headphones' },
];
const SKIN_MARKINGS: { value: SkinMarking; emoji: string; label: string }[] = [
  { value: 'freckles', emoji: '✦', label: 'Freckles' },
  { value: 'beauty_mark', emoji: '•', label: 'Beauty Mark' },
  { value: 'blush_lines', emoji: '=', label: 'Blush Lines' },
];
const OUTFIT_STYLES = [
  { value: 'idol', label: 'Idol' }, { value: 'school', label: 'School' },
  { value: 'fantasy', label: 'Fantasy' }, { value: 'casual', label: 'Casual' },
] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
          : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
        active
          ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
          : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function ColorRow({ label, value, onChange, presets }: { label: string; value: string; onChange: (v: string) => void; presets?: string[] }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-gray-400 text-sm w-28 shrink-0">{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent" />
      {presets && (
        <div className="flex gap-1 flex-wrap">
          {presets.map(c => (
            <button key={c} onClick={() => onChange(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: value === c ? 'white' : 'transparent' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">{title}</h3>
      <div className="bg-card rounded-xl p-3 space-y-1">{children}</div>
    </div>
  );
}

export function AvatarCreator({ config, onChange }: Props) {
  const set = useCallback(<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    onChange({ ...config, [key]: value });
  }, [config, onChange]);

  const toggleAccessory = useCallback((acc: Accessory) => {
    const cur = config.accessories;
    onChange({ ...config, accessories: cur.includes(acc) ? cur.filter(a => a !== acc) : [...cur, acc] });
  }, [config, onChange]);

  const toggleBonus = useCallback((acc: BonusAccessory) => {
    const cur = config.bonusAccessories;
    onChange({ ...config, bonusAccessories: cur.includes(acc) ? cur.filter(a => a !== acc) : [...cur, acc] });
  }, [config, onChange]);

  const toggleMarking = useCallback((m: SkinMarking) => {
    const cur = config.skinMarkings;
    onChange({ ...config, skinMarkings: cur.includes(m) ? cur.filter(a => a !== m) : [...cur, m] });
  }, [config, onChange]);

  return (
    <div className="flex gap-6 h-full">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/40 ring-1 ring-white/10">
          <Avatar3DCanvas config={config} liveState={PREVIEW_STATE} width={300} height={375} />
        </div>
        <p className="text-gray-500 text-xs">Preview (happy expression)</p>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[600px] custom-scroll">
        <Section title="Skin">
          <ColorRow label="Skin Color" value={config.skinColor} onChange={v => set('skinColor', v)}
            presets={['#fde8d0', '#f5c99f', '#e8a87c', '#c68642', '#8d5524']} />
          <div className="pt-1">
            <p className="text-gray-400 text-xs mb-1.5">Markings</p>
            <div className="flex gap-2 flex-wrap">
              {SKIN_MARKINGS.map(m => (
                <ToggleChip key={m.value} active={config.skinMarkings.includes(m.value)} onClick={() => toggleMarking(m.value)}>
                  <span>{m.emoji}</span><span>{m.label}</span>
                </ToggleChip>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Hair">
          <div className="flex gap-2 flex-wrap mb-2">
            {HAIR_STYLES.map(s => <Chip key={s.value} active={config.hairStyle === s.value} onClick={() => set('hairStyle', s.value)}>{s.label}</Chip>)}
          </div>
          <ColorRow label="Hair Color" value={config.hairColor} onChange={v => set('hairColor', v)}
            presets={['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#111827', '#f3f4f6', '#1e40af']} />
          <ColorRow label="Highlights" value={config.hairHighlightColor} onChange={v => set('hairHighlightColor', v)}
            presets={['#a78bfa', '#f9a8d4', '#fcd34d', '#6ee7b7', '#93c5fd']} />
        </Section>

        <Section title="Eyes">
          <div className="flex gap-2 flex-wrap mb-2">
            {EYE_STYLES.map(s => <Chip key={s.value} active={config.eyeStyle === s.value} onClick={() => set('eyeStyle', s.value)}>{s.label}</Chip>)}
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {EYE_DECOS.map(d => <Chip key={d.value} active={config.eyeDecoration === d.value} onClick={() => set('eyeDecoration', d.value)}>{d.label}</Chip>)}
          </div>
          <ColorRow label="Eye Color" value={config.eyeColor} onChange={v => set('eyeColor', v)}
            presets={['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']} />
          <ColorRow label="Eyebrow" value={config.eyebrowColor} onChange={v => set('eyebrowColor', v)} />
        </Section>

        <Section title="Outfit">
          <div className="flex gap-2 flex-wrap mb-2">
            {OUTFIT_STYLES.map(s => <Chip key={s.value} active={config.outfitStyle === s.value} onClick={() => set('outfitStyle', s.value)}>{s.label}</Chip>)}
          </div>
          <ColorRow label="Outfit" value={config.outfitColor} onChange={v => set('outfitColor', v)}
            presets={['#1e1b4b', '#831843', '#14532d', '#1c1917', '#0c4a6e', '#7f1d1d']} />
          <ColorRow label="Accent" value={config.accentColor} onChange={v => set('accentColor', v)}
            presets={['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']} />
        </Section>

        <Section title="Details">
          <ColorRow label="Lips" value={config.lipColor} onChange={v => set('lipColor', v)}
            presets={['#f472b6', '#fb7185', '#e879f9', '#c084fc']} />
          <ColorRow label="Blush" value={config.blushColor} onChange={v => set('blushColor', v)}
            presets={['#f9a8d4', '#fca5a5', '#fdba74', '#f0abfc']} />
        </Section>

        <Section title="Accessories">
          <p className="text-gray-500 text-xs mb-1.5">Head</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {ACCESSORIES.map(a => (
              <ToggleChip key={a.value} active={config.accessories.includes(a.value)} onClick={() => toggleAccessory(a.value)}>
                <span>{a.emoji}</span><span>{a.label}</span>
              </ToggleChip>
            ))}
          </div>
          <p className="text-gray-500 text-xs mb-1.5">Bonus</p>
          <div className="flex gap-2 flex-wrap">
            {BONUS_ACCS.map(a => (
              <ToggleChip key={a.value} active={config.bonusAccessories.includes(a.value)} onClick={() => toggleBonus(a.value)}>
                <span>{a.emoji}</span><span>{a.label}</span>
              </ToggleChip>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
