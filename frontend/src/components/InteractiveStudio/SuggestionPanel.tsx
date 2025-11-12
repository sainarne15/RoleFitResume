'use client';

import { useState } from 'react';

interface BulletChange {
  sectionKey: string;
  jobIndex?: number;
  bulletIndex: number;
  original: string;
  suggested: string;
  accepted: boolean;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SuggestionPanelProps {
  changes: Record<string, BulletChange>;
  currentSection: string;
  onAccept: (key: string) => void;
  onReject: (key: string) => void;
  onEdit: (key: string, text: string) => void;
  onBuildFinal: () => string;
  acceptedCount: number;
  totalChanges: number;
}

export default function SuggestionPanel({
  changes,
  currentSection,
  onAccept,
  onReject,
  onEdit,
  onBuildFinal,
  acceptedCount,
  totalChanges
}: SuggestionPanelProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const handleStartEdit = (key: string, currentText: string) => {
    setEditingKey(key);
    setEditText(currentText);
  };

  const handleSaveEdit = (key: string) => {
    onEdit(key, editText);
    setEditingKey(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditText('');
  };

  // Filter changes by current section if selected
  const filteredChanges = currentSection
    ? Object.entries(changes).filter(([key, change]) => change.sectionKey === currentSection)
    : Object.entries(changes);

  const pendingChanges = filteredChanges.filter(([, change]) => change.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center">
            <span className="text-2xl mr-2">✨</span> AI Suggestions
          </h2>
          {totalChanges > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                {acceptedCount} accepted
              </span>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {pendingChanges.length} pending
              </span>
            </div>
          )}
        </div>

        {currentSection && (
          <div className="mt-3 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
            Viewing: <span className="font-semibold uppercase">{currentSection}</span>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
        {filteredChanges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <div className="text-6xl mb-4">💡</div>
            <p className="text-gray-400 text-lg">No suggestions yet</p>
            <p className="text-gray-300 text-sm mt-2">Click "Generate AI Suggestions" to start</p>
          </div>
        ) : (
          filteredChanges.map(([key, change]) => (
            <div
              key={key}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
                change.status === 'accepted' ? 'border-green-500 bg-green-50' :
                change.status === 'rejected' ? 'border-red-300 bg-red-50 opacity-60' :
                'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="p-5">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    change.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    change.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {change.status === 'accepted' ? '✓ ACCEPTED' :
                     change.status === 'rejected' ? '✗ REJECTED' :
                     '⏳ PENDING'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {change.sectionKey} {change.jobIndex !== undefined && `• Job ${change.jobIndex + 1}`}
                  </span>
                </div>

                {/* Git Diff Style */}
                <div className="space-y-3">
                  {/* Original (Red background) */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded"></div>
                    <div className="pl-4 py-2 bg-red-50 rounded-r text-sm leading-relaxed">
                      <div className="text-xs font-semibold text-red-700 mb-1">ORIGINAL:</div>
                      <div className="text-gray-800">{change.original}</div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-purple-100 px-4 py-1 rounded-full text-purple-600 font-semibold text-sm">
                      ↓ AI Suggestion ↓
                    </div>
                  </div>

                  {/* Suggested (Green background) */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded"></div>
                    <div className="pl-4 py-2 bg-green-50 rounded-r">
                      <div className="text-xs font-semibold text-green-700 mb-1">ENHANCED:</div>
                      {editingKey === key ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border-2 border-purple-300 rounded text-sm leading-relaxed focus:ring-2 focus:ring-purple-500"
                          rows={3}
                        />
                      ) : (
                        <div className="text-gray-800 text-sm leading-relaxed">{change.suggested}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {change.status === 'pending' && editingKey !== key && (
                    <>
                      <button
                        onClick={() => onAccept(key)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleStartEdit(key, change.suggested)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => onReject(key)}
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-500 transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}

                  {editingKey === key && (
                    <>
                      <button
                        onClick={() => handleSaveEdit(key)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {change.status === 'accepted' && (
                    <button
                      onClick={() => onReject(key)}
                      className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400"
                    >
                      Undo Accept
                    </button>
                  )}

                  {change.status === 'rejected' && (
                    <button
                      onClick={() => onAccept(key)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                    >
                      Accept Instead
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Build Final Resume Button */}
      {acceptedCount > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-500">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You've accepted <span className="font-bold text-green-600">{acceptedCount}</span> changes
            </p>
            <button
              onClick={() => {
                const finalResume = onBuildFinal();
                // TODO: Show final resume or download
                console.log('Final Resume:', finalResume);
                alert('Final resume built! Check console for now.');
              }}
              className="btn-success w-full text-lg py-4"
            >
              📄 Build Final Enhanced Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}