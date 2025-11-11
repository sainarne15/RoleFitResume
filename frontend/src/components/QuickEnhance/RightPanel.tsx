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

  // Calculate highlighted text - only show NEW additions
  const highlightedText = useMemo(() => {
    if (!enhancedResume || !showHighlights) return enhancedResume;

    // Split both into words and normalize for comparison
    const originalWords = originalResume
      .toLowerCase()
      .replace(/[.,!?;:()\[\]{}]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 0);

    const originalWordSet = new Set(originalWords);

    // Process enhanced resume line by line to preserve structure
    const enhancedLines = enhancedResume.split('\n');

    return enhancedLines.map(line => {
      const words = line.split(/(\s+)/); // Keep spaces

      return words.map((word, idx) => {
        if (!word.trim()) return word; // Preserve spaces

        const cleanWord = word
          .toLowerCase()
          .replace(/[.,!?;:()\[\]{}]/g, '')
          .trim();

        // Only highlight if word is truly new (not in original at all)
        if (cleanWord.length > 2 && !originalWordSet.has(cleanWord)) {
          return `<span class="highlight-new">${word}</span>`;
        }
        return word;
      }).join('');
    }).join('\n');
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
          <div className="text-sm text-gray-900 space-y-1">
            {enhancedResume.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();

              // Detect line types
              const isBullet = /^[•\-●○*►]/.test(trimmedLine);
              const isHeader = /^[A-Z\s]{3,}$/.test(trimmedLine) ||
                              /^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE|OBJECTIVE)/i.test(trimmedLine);
              const isEmpty = !trimmedLine;

              if (isEmpty) {
                return <div key={idx} className="h-2" />;
              } else if (isHeader) {
                return (
                  <div key={idx} className="font-bold text-base text-gray-900 mt-4 mb-2 uppercase tracking-wide">
                    {line}
                  </div>
                );
              } else if (isBullet) {
                // For bullet points, highlight new words if enabled
                if (showHighlights) {
                  const words = line.split(/(\s+)/);
                  const originalWordsSet = new Set(
                    originalResume.toLowerCase()
                      .replace(/[.,!?;:()\[\]{}]/g, '')
                      .split(/\s+/)
                  );

                  return (
                    <div key={idx} className="pl-4 leading-relaxed">
                      {words.map((word, widx) => {
                        if (!word.trim()) return word;
                        const cleanWord = word.toLowerCase().replace(/[.,!?;:()\[\]{}]/g, '');
                        if (cleanWord.length > 2 && !originalWordsSet.has(cleanWord)) {
                          return <span key={widx} className="highlight-new">{word}</span>;
                        }
                        return word;
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="pl-4 leading-relaxed text-gray-800">
                      {line}
                    </div>
                  );
                }
              } else {
                // Regular lines
                if (showHighlights) {
                  const words = line.split(/(\s+)/);
                  const originalWordsSet = new Set(
                    originalResume.toLowerCase()
                      .replace(/[.,!?;:()\[\]{}]/g, '')
                      .split(/\s+/)
                  );

                  return (
                    <div key={idx} className="leading-relaxed">
                      {words.map((word, widx) => {
                        if (!word.trim()) return word;
                        const cleanWord = word.toLowerCase().replace(/[.,!?;:()\[\]{}]/g, '');
                        if (cleanWord.length > 2 && !originalWordsSet.has(cleanWord)) {
                          return <span key={widx} className="highlight-new">{word}</span>;
                        }
                        return word;
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="leading-relaxed text-gray-800">
                      {line}
                    </div>
                  );
                }
              }
            })}
          </div>
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