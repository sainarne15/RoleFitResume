'use client';

import { useState } from 'react';
import FileUpload from './FileUpload';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import Settings from './Settings';
import { api } from '@/lib/api';
import { Resume, ATSScore, VersionHistory } from '@/types';

export default function QuickEnhance() {
  // State
  const [originalResume, setOriginalResume] = useState<Resume | null>(null);
  const [enhancedResume, setEnhancedResume] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [originalScore, setOriginalScore] = useState<ATSScore | null>(null);
  const [enhancedScore, setEnhancedScore] = useState<ATSScore | null>(null);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Settings state
  const [provider, setProvider] = useState<string>('claude');
  const [model, setModel] = useState<string>('claude-sonnet-4-20250514');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    claude: '',
    openrouter: ''
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.extractDocument(file);
      
      if (result.success) {
        setOriginalResume({
          text: result.text,
          sections: result.sections,
          word_count: result.word_count,
          line_count: result.line_count
        });
        
        // Calculate initial ATS score if JD exists
        if (jobDescription) {
          const score = await api.calculateScore(result.text, jobDescription);
          setOriginalScore(score);
        }
      } else {
        setError(result.error || 'Failed to extract document');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job description change
  const handleJobDescriptionChange = async (jd: string) => {
    setJobDescription(jd);
    
    // Recalculate score if resume exists
    if (originalResume && jd) {
      try {
        const score = await api.calculateScore(originalResume.text, jd);
        setOriginalScore(score);
      } catch (err) {
        console.error('Error calculating score:', err);
      }
    }
  };

  // Enhance resume
  const handleEnhance = async () => {
    if (!originalResume || !jobDescription) {
      setError('Please upload resume and job description');
      return;
    }

    const currentApiKey = apiKeys[provider];
    if (!currentApiKey) {
      setError(`Please provide API key for ${provider}`);
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
        currentApiKey
      );

      if (result.success) {
        setEnhancedResume(result.enhanced_resume);
        
        // Calculate enhanced score
        const score = await api.calculateScore(result.enhanced_resume, jobDescription);
        setEnhancedScore(score);
        
        // Add to history
        const newVersion = currentVersion + 1;
        setCurrentVersion(newVersion);
        setHistory([...history, {
          version: newVersion,
          resume: result.enhanced_resume,
          ats_score: score.score,
          timestamp: new Date().toISOString()
        }]);
      } else {
        setError(result.error || 'Enhancement failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error enhancing resume');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore version from history
  const handleRestoreVersion = (version: VersionHistory) => {
    setEnhancedResume(version.resume);
    setEnhancedScore({ score: version.ats_score, breakdown: {} as any });
    setCurrentVersion(version.version);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📄 Resume ATS Enhancer
              </h1>
              <p className="text-sm text-gray-500 mt-1">Quick Enhance Mode - Smart Resume Optimization</p>
            </div>
            <div className="text-sm text-gray-500">
              Powered by AI • {provider === 'openai' ? 'OpenAI' : provider === 'claude' ? 'Claude' : 'OpenRouter'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 py-8">
        {/* Settings */}
        <Settings
          provider={provider}
          model={model}
          apiKeys={apiKeys}
          history={history}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onApiKeysChange={setApiKeys}
          onRestoreVersion={handleRestoreVersion}
        />

        {/* File Upload */}
        <FileUpload
          onFileUpload={handleFileUpload}
          onJobDescriptionChange={handleJobDescriptionChange}
          jobDescription={jobDescription}
          isLoading={isLoading}
        />

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

        {/* Action Buttons */}
        {originalResume && jobDescription && (
          <div className="mb-8 flex gap-4">
            <button
              onClick={handleEnhance}
              disabled={isLoading}
              className="btn-primary flex-1 text-lg py-4"
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
            <button
              onClick={handleEnhance}
              disabled={isLoading}
              className="btn-secondary px-8 py-4"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Side by Side View */}
        {originalResume && (
          <div className="grid grid-cols-2 gap-8">
            <LeftPanel
              resume={originalResume}
              jobDescription={jobDescription}
            />
            <RightPanel
              enhancedResume={enhancedResume}
              originalResume={originalResume.text}
              currentVersion={currentVersion}
            />
          </div>
        )}
      </div>
    </div>
  );
}