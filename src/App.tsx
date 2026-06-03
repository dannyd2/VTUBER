import { useState, useCallback } from 'react';
import type { AvatarConfig } from './types/avatar';
import { DEFAULT_CONFIG } from './types/avatar';
import { AvatarCreator } from './components/AvatarCreator';
import { LiveMode } from './components/LiveMode';
import { StreamMode } from './components/StreamMode';

type Tab = 'creator' | 'live' | 'stream';

const TABS: { value: Tab; label: string; icon: string; desc: string }[] = [
  { value: 'creator', label: 'Avatar Creator', icon: '🎨', desc: 'Customize your look' },
  { value: 'live', label: 'Live Mode', icon: '🎤', desc: 'Stream with lip sync' },
  { value: 'stream', label: 'Stream View', icon: '📺', desc: 'OBS-ready output' },
];

const STORAGE_KEY = 'vtuber_avatar_config';

export default function App() {
  const [tab, setTab] = useState<Tab>('creator');
  const [config, setConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const handleConfigChange = useCallback((newConfig: AvatarConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {}
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/5 bg-panel/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">
              ✨
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                VTuber Studio
              </h1>
              <p className="text-gray-500 text-xs">Create your virtual avatar</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  tab === t.value
                    ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={resetConfig}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            {TABS.find(t => t.value === tab)?.icon}{' '}
            {TABS.find(t => t.value === tab)?.label}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">{TABS.find(t => t.value === tab)?.desc}</p>
        </div>

        {tab === 'creator' && (
          <AvatarCreator config={config} onChange={handleConfigChange} />
        )}
        {tab === 'live' && (
          <LiveMode config={config} />
        )}
        {tab === 'stream' && (
          <StreamMode config={config} />
        )}
      </main>
    </div>
  );
}
