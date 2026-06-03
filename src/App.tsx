import { useState, useCallback, useRef } from 'react';
import type { AvatarConfig } from './types/avatar';
import { DEFAULT_CONFIG } from './types/avatar';
import { AvatarCreator } from './components/AvatarCreator';
import { LiveMode } from './components/LiveMode';
import { StreamMode } from './components/StreamMode';

type Tab = 'creator' | 'live' | 'stream';

const TABS: { value: Tab; label: string; icon: string; desc: string }[] = [
  { value: 'creator', label: 'Creator',    icon: '🎨', desc: 'Customize your look' },
  { value: 'live',    label: 'Live Mode',  icon: '🎤', desc: 'Stream with lip sync' },
  { value: 'stream',  label: 'Stream View',icon: '📺', desc: 'OBS-ready output' },
];

const CONFIG_KEY   = 'vtuber_avatar_config';
const PRESETS_KEY  = 'vtuber_presets';

type Presets = Record<string, AvatarConfig>;

function loadPresets(): Presets {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePresets(p: Presets) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); } catch {}
}

export default function App() {
  const [tab, setTab] = useState<Tab>('creator');
  const [config, setConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [presets, setPresets] = useState<Presets>(loadPresets);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = useCallback((c: AvatarConfig) => {
    setConfig(c);
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch {}
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(CONFIG_KEY);
  }, []);

  const savePreset = useCallback(() => {
    const name = presetName.trim() || `Preset ${Object.keys(presets).length + 1}`;
    const next = { ...presets, [name]: config };
    setPresets(next);
    savePresets(next);
    setPresetName('');
    setShowPresets(false);
  }, [presets, config, presetName]);

  const loadPreset = useCallback((name: string) => {
    const p = presets[name];
    if (p) handleConfigChange({ ...DEFAULT_CONFIG, ...p });
    setShowPresets(false);
  }, [presets, handleConfigChange]);

  const deletePreset = useCallback((name: string) => {
    const next = { ...presets };
    delete next[name];
    setPresets(next);
    savePresets(next);
  }, [presets]);

  return (
    <div className="min-h-screen bg-surface text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-white/5 bg-panel/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">✨</div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">VTuber Studio</h1>
              <p className="text-gray-500 text-xs hidden sm:block">Create your virtual avatar</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  tab === t.value
                    ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Preset controls */}
          <div className="flex items-center gap-2 shrink-0 relative">
            <button onClick={() => setShowPresets(v => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-1.5">
              💾 Presets
              {Object.keys(presets).length > 0 && (
                <span className="bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{Object.keys(presets).length}</span>
              )}
            </button>
            <button onClick={resetConfig}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5">
              Reset
            </button>

            {showPresets && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-3 z-30">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-2">Save Current</p>
                <div className="flex gap-2 mb-3">
                  <input ref={inputRef} value={presetName} onChange={e => setPresetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePreset()}
                    placeholder="Preset name…"
                    className="flex-1 bg-white/5 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 outline-none focus:border-purple-500 placeholder-gray-600" />
                  <button onClick={savePreset}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all">
                    Save
                  </button>
                </div>
                {Object.keys(presets).length > 0 && (
                  <>
                    <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-2">Load</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scroll">
                      {Object.keys(presets).map(name => (
                        <div key={name} className="flex items-center gap-2">
                          <button onClick={() => loadPreset(name)}
                            className="flex-1 text-left px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-gray-300 text-xs transition-all truncate">
                            {name}
                          </button>
                          <button onClick={() => deletePreset(name)}
                            className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-1.5 rounded transition-colors">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showPresets && (
        <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)} />
      )}

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">
            {TABS.find(t => t.value === tab)?.icon}{' '}{TABS.find(t => t.value === tab)?.label}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">{TABS.find(t => t.value === tab)?.desc}</p>
        </div>

        {tab === 'creator' && <AvatarCreator config={config} onChange={handleConfigChange} />}
        {tab === 'live'    && <LiveMode config={config} />}
        {tab === 'stream'  && <StreamMode config={config} />}
      </main>
    </div>
  );
}
