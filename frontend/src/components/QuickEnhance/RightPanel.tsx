'use client';

import { useState, useMemo } from 'react';

interface RightPanelProps {
  enhancedResume: string;
  originalResume: string;
  currentVersion: number;
}

export default function RightPanel({
  enhancedResume,
  originalResume,
  currentVersion
}: RightPanelProps) {
  const [showHighlights, setShowHighlights] = useState(true);

  // Calculate highlighted text - only show additions
  const highlightedText = useMemo(() => {
    if (!enhancedResume || !showHighlights) return enhancedResume;

    const originalWords = new Set(originalResume.toLowerCase().split(/\s+/));
    const enhancedWords = enhancedResume.split(/\s+/);

    return enhancedWords.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:()]/g, '');
      const isNew = !originalWords.has(cleanWord);

      if (isNew && cleanWord.length > 0) {
        return `<span key="${idx}" class="highlight-new">${word}</span>`;
      }
      return word;
    }).join(' ');
  }, [enhancedResume, originalResume, showHighlights]);

  const wordCount = enhancedResume ? enhancedResume.split(/\s+/).length : 0;
  const lineCount = enhancedResume ? enhancedResume.split('\n').length : 0;
  const wordDiff = wordCount - (originalResume?.split(/\s+/).length || 0);
  const isWithinTarget = Math.abs(wordDiff) <= 10;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <span className="text-2xl mr-2">✨</span> Enhanced Resume
          {currentVersion > 0 && (
            <span className="ml-2 text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
              v{currentVersion}
            </span>
          )}
        </h2>
        {enhancedResume && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                {wordCount} words
              </span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                isWithinTarget ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
              }`}>
                {wordDiff > 0 ? '+' : ''}{wordDiff} {isWithinTarget ? '✓' : '⚠'}
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors">
              <input
                type="checkbox"
                checked={showHighlights}
                onChange={(e) => setShowHighlights(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              🎨 Highlights
            </label>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-lg border-2 border-gray-200 max-h-[700px] overflow-y-auto custom-scrollbar">
        {enhancedResume ? (
          showHighlights ? (
            <div
              className="enhanced-text text-gray-900 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          ) : (
            <textarea
              value={enhancedResume}
              readOnly
              className="w-full h-full enhanced-text text-gray-900 bg-transparent border-none focus:outline-none resize-none"
              style={{ minHeight: '600px' }}
            />
          )
        ) : (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400 text-lg">Enhanced resume will appear here...</p>
            <p className="text-gray-300 text-sm mt-2">Upload your resume and click "Enhance" to get started</p>
          </div>
        )}
      </div>

      {/* Download Button */}
      {enhancedResume && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => {
              const blob = new Blob([enhancedResume], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `enhanced_resume_v${currentVersion}.txt`;
              a.click();
            }}
            className="btn-success w-full text-lg py-4"
          >
            📥 Download Enhanced Resume
          </button>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800 flex items-start">
              <span className="text-lg mr-2">💡</span>
              <span><strong>Pro Tip:</strong> Copy the enhanced text and paste it into your original Word/PDF document to preserve your formatting and fonts!</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}