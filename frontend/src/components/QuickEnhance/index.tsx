'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Resume, ATSScore, VersionHistory } from '@/types';
import FileUpload from './FileUpload';

interface QuickEnhanceProps {
  onDataChange: (data: any) => void;
  provider: string;
  model: string;
  apiKey: string;
  globalApiKeys: Record<string, string>;
}

export default function QuickEnhance({
  onDataChange,
  provider,
  model,
  apiKey,
  globalApiKeys
}: QuickEnhanceProps) {
  const [originalResume, setOriginalResume] = useState<Resume | null>(null);
  const [enhancedResume, setEnhancedResume] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [originalScore, setOriginalScore] = useState<ATSScore | null>(null);
  const [enhancedScore, setEnhancedScore] = useState<ATSScore | null>(null);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    setUploadedFileName(file.name);

    try {
      const result = await api.extractDocument(file);

      if (result.success) {
        setOriginalResume({
          text: result.text,
          sections: result.sections,
          word_count: result.word_count,
          line_count: result.line_count
        });

        if (jobDescription) {
          const score = await api.calculateScore(result.text, jobDescription);
          setOriginalScore(score);
        }
      } else {
        setError(result.error || 'Failed to extract document');
        setUploadedFileName('');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      setUploadedFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDescriptionChange = async (jd: string) => {
    setJobDescription(jd);

    if (originalResume && jd) {
      try {
        const score = await api.calculateScore(originalResume.text, jd);
        setOriginalScore(score);
      } catch (err) {
        console.error('Error calculating score:', err);
      }
    }
  };

  const handleEnhance = async () => {
    if (!originalResume || !jobDescription) {
      setError('Please upload resume and job description');
      return;
    }

    if (!apiKey) {
      setError(`Please provide API key in the sidebar settings`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await api.enhanceResume(
        originalResume.text,
        jobDescription,
        provider,
        model,
        apiKey
      );

      if (result.success) {
        setEnhancedResume(result.enhanced_resume);

        const score = await api.calculateScore(result.enhanced_resume, jobDescription);
        setEnhancedScore(score);

        const newVersion = currentVersion + 1;
        setCurrentVersion(newVersion);
        setHistory([...history, {
          version: newVersion,
          resume: result.enhanced_resume,
          ats_score: score.score,
          timestamp: new Date().toISOString()
        }]);

        onDataChange({
          resume: originalResume,
          jobDescription: jobDescription
        });
      } else {
        setError(result.error || 'Enhancement failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error enhancing resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = (version: VersionHistory) => {
    setEnhancedResume(version.resume);
    setEnhancedScore({ score: version.ats_score, breakdown: {} as any });
    setCurrentVersion(version.version);
  };

  // Helper to render formatted resume
  const renderFormattedResume = (resumeText: string, sections: any, isEnhanced: boolean = false) => {
    return (
      <div className="space-y-6">
        {/* Header/Contact */}
        {sections.header?.lines && sections.header.lines.length > 0 && (
          <div className="pb-4 border-b-2 border-gray-300">
            {sections.header.lines.map((line: string, idx: number) => (
              <div key={idx} className="text-center">
                {idx === 0 ? (
                  <h2 className="text-2xl font-bold text-gray-900">{line}</h2>
                ) : (
                  <p className="text-sm text-gray-700">{line}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {sections.summary?.blocks && sections.summary.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              SUMMARY
            </h3>
            {sections.summary.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 leading-relaxed mb-2">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Skills */}
        {sections.skills?.blocks && sections.skills.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              SKILLS
            </h3>
            <div className="space-y-1">
              {sections.skills.blocks.map((block: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-800">
                  • {block.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {sections.experience?.jobs && sections.experience.jobs.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              EXPERIENCE
            </h3>
            {sections.experience.jobs.map((job: any, jobIdx: number) => (
              <div key={jobIdx} className="mb-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">{job.title}</h4>
                <div className="space-y-1">
                  {job.bullets.map((bullet: string, bulletIdx: number) => (
                    <div key={bulletIdx} className="text-sm text-gray-800 pl-4">
                      • {bullet}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {sections.education?.blocks && sections.education.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              EDUCATION
            </h3>
            {sections.education.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Projects */}
        {sections.projects?.blocks && sections.projects.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              PROJECTS
            </h3>
            {sections.projects.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Certifications */}
        {sections.certifications?.blocks && sections.certifications.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              CERTIFICATIONS
            </h3>
            {sections.certifications.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Awards */}
        {sections.awards?.blocks && sections.awards.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              AWARDS
            </h3>
            {sections.awards.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Publications */}
        {sections.publications?.blocks && sections.publications.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              PUBLICATIONS
            </h3>
            {sections.publications.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Volunteer */}
        {sections.volunteer?.blocks && sections.volunteer.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              VOLUNTEER
            </h3>
            {sections.volunteer.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Languages */}
        {sections.languages?.blocks && sections.languages.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              LANGUAGES
            </h3>
            {sections.languages.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}

        {/* Interests */}
        {sections.interests?.blocks && sections.interests.blocks.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              INTERESTS
            </h3>
            {sections.interests.blocks.map((block: any, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">
                {block.text}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper to highlight differences in enhanced text
  const renderEnhancedWithHighlights = (enhancedText: string, originalText: string) => {
    // Split into words for comparison
    const originalWords = new Set(
      originalText.toLowerCase()
        .replace(/[.,!?;:()\[\]{}]/g, '')
        .split(/\s+/)
    );

    // Split enhanced text into lines and words
    const lines = enhancedText.split('\n');

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      // Check if it's a section header
      const isHeader = /^[A-Z\s]{3,}$/.test(trimmed) ||
                      /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROFILE)/i.test(trimmed);

      if (isHeader) {
        return (
          <h3 key={lineIdx} className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
            {line}
          </h3>
        );
      }

      if (!trimmed) {
        return <div key={lineIdx} className="h-2" />;
      }

      // For content lines, highlight new words
      const words = line.split(/(\s+)/);

      return (
        <div key={lineIdx} className="text-sm text-gray-800 leading-relaxed mb-1">
          {words.map((word, widx) => {
            if (!word.trim()) return word;

            const cleanWord = word.toLowerCase().replace(/[.,!?;:()\[\]{}]/g, '');

            // Highlight if word is new (not in original)
            if (cleanWord.length > 2 && !originalWords.has(cleanWord)) {
              return (
                <span key={widx} className="bg-green-200 font-semibold px-1 rounded">
                  {word}
                </span>
              );
            }

            return word;
          })}
        </div>
      );
    });
  };

  const wordCount = enhancedResume ? enhancedResume.split(/\s+/).length : 0;
  const wordDiff = originalResume ? wordCount - originalResume.word_count : 0;
  const isWithinTarget = Math.abs(wordDiff) <= 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 Quick Enhance
              </h1>
              <p className="text-sm text-gray-500 mt-1">One-click resume optimization</p>
            </div>
            <div className="text-sm text-gray-500">
              Using: <span className="font-semibold text-blue-600">{provider}</span> • {model.split('-')[0]}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 py-8">
        {/* File Upload */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <FileUpload
            onFileUpload={handleFileUpload}
            onJobDescriptionChange={handleJobDescriptionChange}
            jobDescription={jobDescription}
            isLoading={isLoading}
            uploadedFileName={uploadedFileName}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* ATS Scores */}
        {(originalScore || enhancedScore) && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Original ATS Score</h3>
                <span className={`score-badge ${originalScore && originalScore.score >= 70 ? 'score-excellent' : originalScore && originalScore.score >= 50 ? 'score-good' : 'score-poor'}`}>
                  {originalScore && originalScore.score >= 70 ? '🟢 Excellent' : originalScore && originalScore.score >= 50 ? '🟡 Good' : '🔴 Needs Work'}
                </span>
              </div>
              <div className="text-5xl font-bold text-gray-900 mt-2">
                {originalScore?.score.toFixed(1) || 0}<span className="text-2xl text-gray-400">%</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Enhanced ATS Score</h3>
                {enhancedScore && originalScore && (
                  <span className="score-badge score-excellent">
                    +{(enhancedScore.score - originalScore.score).toFixed(1)} points
                  </span>
                )}
              </div>
              <div className="text-5xl font-bold text-green-700 mt-2">
                {enhancedScore?.score.toFixed(1) || '--'}<span className="text-2xl text-green-400">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Version History */}
        {history.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <span className="text-lg mr-2">📚</span> Version History ({history.length})
            </h3>
            <div className="space-y-2">
              {history.slice().reverse().slice(0, 5).map((version) => (
                <div
                  key={version.version}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all border border-gray-200 hover:border-blue-300 hover:shadow-md"
                  onClick={() => handleRestoreVersion(version)}
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
                      Score: {version.ats_score.toFixed(1)}%
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

        {/* Action Button */}
        {originalResume && jobDescription && (
          <div className="mb-8">
            <button
              onClick={handleEnhance}
              disabled={isLoading}
              className="btn-primary w-full text-lg py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enhancing...
                </span>
              ) : (
                '✨ Enhance Resume'
              )}
            </button>
          </div>
        )}

        {/* Side by Side Resume View - FORMATTED LIKE FINAL PREVIEW */}
        {originalResume && (
          <div className="grid grid-cols-2 gap-8">
            {/* Left: Original Resume - FORMATTED */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">📄</span> Original Resume
              </h2>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-lg border-2 border-gray-200 max-h-[800px] overflow-y-auto custom-scrollbar">
                {renderFormattedResume(originalResume.text, originalResume.sections, false)}
              </div>
            </div>

            {/* Right: Enhanced Resume - FORMATTED WITH GREEN HIGHLIGHTS */}
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
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-lg border-2 border-gray-200 max-h-[800px] overflow-y-auto custom-scrollbar">
                {enhancedResume ? (
                  renderEnhancedWithHighlights(enhancedResume, originalResume.text)
                ) : (
                  <div className="text-center py-32">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-400 text-lg">Enhanced resume will appear here...</p>
                    <p className="text-gray-300 text-sm mt-2">Click "Enhance Resume" to get started</p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              {enhancedResume && (
                <div className="mt-6">
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}