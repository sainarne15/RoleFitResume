'use client';

import { useState, useEffect } from 'react';
import QuickEnhance from '@/components/QuickEnhance';
import InteractiveStudio from '@/components/InteractiveStudio';

type Mode = 'quick' | 'interactive';

export default function Home() {
  const [mode, setMode] = useState<Mode>('quick');
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [apiKey, setApiKey] = useState('');
  const [globalApiKeys, setGlobalApiKeys] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  // SHARED STATE - Resume and JD persist across modes
  const [sharedResume, setSharedResume] = useState<any>(null);
  const [sharedJobDescription, setSharedJobDescription] = useState<string>('');

  // Fix hydration error
  useEffect(() => {
    setIsClient(true);

    // Load saved settings
    const savedApiKeys = localStorage.getItem('apiKeys');
    if (savedApiKeys) {
      try {
        const keys = JSON.parse(savedApiKeys);
        setGlobalApiKeys(keys);

        if (keys.anthropic) {
          setApiKey(keys.anthropic);
        }
      } catch (e) {
        console.error('Error loading API keys:', e);
      }
    }
  }, []);

  // Update model when provider changes
  useEffect(() => {
    if (!isClient) return;

    const defaultModels: Record<string, string> = {
      'anthropic': 'claude-sonnet-4-20250514',
      'openai': 'gpt-4o',
      'openrouter': 'anthropic/claude-3.5-sonnet'
    };

    setModel(defaultModels[provider] || 'claude-sonnet-4-20250514');

    // Set API key from stored keys
    if (globalApiKeys[provider]) {
      setApiKey(globalApiKeys[provider]);
    } else {
      setApiKey('');
    }
  }, [provider, isClient]);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    const updatedKeys = { ...globalApiKeys, [provider]: key };
    setGlobalApiKeys(updatedKeys);

    try {
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
      console.log('API key saved for', provider);
    } catch (e) {
      console.error('Error saving API key:', e);
    }
  };

  const handleDataChange = (data: any) => {
    if (data.resume) {
      setSharedResume(data.resume);
    }
    if (data.jobDescription) {
      setSharedJobDescription(data.jobDescription);
    }
  };

  const models: Record<string, string[]> = {
    anthropic: [
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-3-5-sonnet-20241022'
    ],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    openrouter: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4-turbo',
      'google/gemini-pro'
    ]
  };

  if (!isClient) {
    // Return minimal UI during SSR to match what client will render initially
    return (
      <div className="flex min-h-screen bg-gray-50">
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume ATS Enhancer</h1>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </aside>
        <main className="flex-1">
          <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Resume ATS Enhancer
          </h1>
          <p className="text-sm text-gray-600">Optimize your resume for ATS systems</p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('quick')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'quick'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚀 Quick
            </button>
            <button
              onClick={() => setMode('interactive')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'interactive'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✏️ Interactive
            </button>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">AI Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {models[provider]?.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            API Key
            <span className="text-xs text-gray-500 font-normal ml-2">
              (Saved locally)
            </span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder={`Enter your ${provider} API key`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Your API key is stored only in your browser
          </p>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Quick: One-click full enhancement</li>
            <li>• Interactive: Point-by-point control</li>
            <li>• Your data stays in browser</li>
            <li>• Resume/JD persist across modes</li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {mode === 'quick' ? (
          <QuickEnhance
            onDataChange={handleDataChange}
            provider={provider}
            model={model}
            apiKey={apiKey}
            globalApiKeys={globalApiKeys}
            sharedResume={sharedResume}
            sharedJobDescription={sharedJobDescription}
          />
        ) : (
          <InteractiveStudio
            sharedData={{
              resume: sharedResume,
              jobDescription: sharedJobDescription
            }}
            provider={provider}
            model={model}
            apiKey={apiKey}
            globalApiKeys={globalApiKeys}
            onDataChange={handleDataChange}
          />
        )}
      </main>
    </div>
  );
}