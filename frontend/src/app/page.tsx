'use client';

import { useState, useEffect } from 'react';
import QuickEnhance from '@/components/QuickEnhance';
import InteractiveStudio from '@/components/InteractiveStudio';
import { LLM_PROVIDERS } from '@/types';

export default function Home() {
  const [mode, setMode] = useState<'quick' | 'interactive'>('quick');
  const [sharedData, setSharedData] = useState<any>(null);

  // SHARED SETTINGS - Persist across both modes
  const [provider, setProvider] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resume-ats-provider') || 'claude';
    }
    return 'claude';
  });

  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resume-ats-model') || 'claude-sonnet-4-20250514';
    }
    return 'claude-sonnet-4-20250514';
  });

  const [globalApiKeys, setGlobalApiKeys] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resume-ats-api-keys');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { openai: '', claude: '', openrouter: '' };
        }
      }
    }
    return { openai: '', claude: '', openrouter: '' };
  });

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('resume-ats-provider', provider);
      localStorage.setItem('resume-ats-model', model);
      localStorage.setItem('resume-ats-api-keys', JSON.stringify(globalApiKeys));
    }
  }, [provider, model, globalApiKeys]);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const newProviderObj = LLM_PROVIDERS[newProvider];
    if (newProviderObj) {
      setModel(newProviderObj.models[0]);
    }
  };

  const handleApiKeysChange = (keys: Record<string, string>) => {
    setGlobalApiKeys(keys);
  };

  const currentProvider = LLM_PROVIDERS[provider];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 h-screen bg-white border-r border-gray-200 shadow-lg flex-shrink-0 flex flex-col sticky top-0">
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📄 Resume ATS
            </h1>
            <p className="text-xs text-gray-500 mt-1">AI-Powered Optimizer</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            <button
              onClick={() => setMode('quick')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'quick'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🚀</span>
                <div>
                  <div className="font-semibold">Quick Enhance</div>
                  <div className={`text-xs ${mode === 'quick' ? 'text-blue-100' : 'text-gray-500'}`}>
                    One-click optimization
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('interactive')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'interactive'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">✏️</span>
                <div>
                  <div className="font-semibold">Interactive Studio</div>
                  <div className={`text-xs ${mode === 'interactive' ? 'text-purple-100' : 'text-gray-500'}`}>
                    Point-by-point control
                  </div>
                </div>
              </div>
            </button>
          </nav>

          {/* SHARED SETTINGS - Available in sidebar */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              ⚙️ Global Settings
            </h3>

            {/* Provider Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                🤖 AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {Object.entries(LLM_PROVIDERS).map(([key, prov]) => (
                  <option key={key} value={key}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                🎯 Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {currentProvider?.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                🔑 API Key
              </label>
              <input
                type="password"
                value={globalApiKeys[provider] || ''}
                onChange={(e) => {
                  handleApiKeysChange({
                    ...globalApiKeys,
                    [provider]: e.target.value
                  });
                }}
                placeholder={`Enter ${currentProvider?.name} API key`}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              💡 Settings apply to both modes
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="text-xs font-bold text-gray-700 mb-2">💡 Tip</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {mode === 'quick'
                ? 'Quick Enhance optimizes your entire resume instantly'
                : 'Interactive Studio lets you review and accept changes individually'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Made with ❤️ for job seekers
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {mode === 'quick' ? (
          <QuickEnhance
            onDataChange={setSharedData}
            provider={provider}
            model={model}
            apiKey={globalApiKeys[provider] || ''}
            globalApiKeys={globalApiKeys}
          />
        ) : (
          <InteractiveStudio
            sharedData={sharedData}
            provider={provider}
            model={model}
            apiKey={globalApiKeys[provider] || ''}
            globalApiKeys={globalApiKeys}
          />
        )}
      </main>
    </div>
  );
}