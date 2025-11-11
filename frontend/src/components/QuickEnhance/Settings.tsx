'use client';

import { LLM_PROVIDERS, VersionHistory } from '@/types';

interface SettingsProps {
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
  history: VersionHistory[];
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onApiKeysChange: (keys: Record<string, string>) => void;
  onRestoreVersion: (version: VersionHistory) => void;
}

export default function Settings({
  provider,
  model,
  apiKeys,
  history,
  onProviderChange,
  onModelChange,
  onApiKeysChange,
  onRestoreVersion
}: SettingsProps) {
  const currentProvider = LLM_PROVIDERS[provider];

  return (
    <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <span className="text-2xl mr-2">⚙️</span> Settings
      </h2>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🤖 AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => {
              onProviderChange(e.target.value);
              const newProvider = LLM_PROVIDERS[e.target.value];
              if (newProvider) {
                onModelChange(newProvider.models[0]);
              }
            }}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            {Object.entries(LLM_PROVIDERS).map(([key, prov]) => (
              <option key={key} value={key}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🎯 Model
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            {currentProvider?.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🔑 API Key
          </label>
          <input
            type="password"
            value={apiKeys[provider] || ''}
            onChange={(e) => {
              onApiKeysChange({
                ...apiKeys,
                [provider]: e.target.value
              });
            }}
            placeholder={`Enter ${currentProvider?.name} API key`}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Version History */}
      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <span className="text-lg mr-2">📚</span> Version History ({history.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {history.slice().reverse().slice(0, 5).map((version) => (
              <div
                key={version.version}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all border border-gray-200 hover:border-blue-300 hover:shadow-md"
                onClick={() => onRestoreVersion(version)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    v{version.version}
                  </span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    version.ats_score >= 70 ? 'bg-green-100 text-green-700' : 
                    version.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    Score: {version.ats_score}%
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(version.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}