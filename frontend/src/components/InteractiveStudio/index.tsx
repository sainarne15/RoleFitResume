'use client';

import { useState } from 'react';
import { Resume } from '@/types';
import { api } from '@/lib/api';
import FileUpload from '../QuickEnhance/FileUpload';

interface InteractiveStudioProps {
  sharedData?: any;
  provider: string;
  model: string;
  apiKey: string;
  globalApiKeys: Record<string, string>;
}

interface Block {
  id: string;
  sectionKey: string;
  sectionTitle: string;
  jobIndex?: number;
  jobTitle?: string;
  text: string;
  enhancedText: string;
  status: 'original' | 'enhanced' | 'accepted' | 'rejected';
  type: 'summary' | 'skill' | 'bullet' | 'text';
}

export default function InteractiveStudio({
  sharedData,
  provider,
  model,
  apiKey,
  globalApiKeys
}: InteractiveStudioProps) {
  const [originalResume, setOriginalResume] = useState<Resume | null>(sharedData?.resume || null);
  const [jobDescription, setJobDescription] = useState<string>(sharedData?.jobDescription || '');
  const [isLoading, setIsLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [enhancementProgress, setEnhancementProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
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

        convertToBlocks(result.sections);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadedFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBlocks = (sections: any) => {
    const newBlocks: Block[] = [];
    let blockId = 0;

    const getSectionTitle = (key: string) => {
      const titles: Record<string, string> = {
        'summary': 'SUMMARY',
        'skills': 'SKILLS',
        'experience': 'EXPERIENCE',
        'education': 'EDUCATION',
        'projects': 'PROJECTS',
        'certifications': 'CERTIFICATIONS',
        'awards': 'AWARDS & ACHIEVEMENTS',
        'publications': 'PUBLICATIONS',
        'volunteer': 'VOLUNTEER EXPERIENCE',
        'languages': 'LANGUAGES',
        'interests': 'INTERESTS'
      };
      return titles[key] || key.toUpperCase();
    };

    // Summary
    if (sections.summary?.blocks && sections.summary.blocks.length > 0) {
      const summaryText = sections.summary.blocks.map((b: any) => b.text).join(' ');
      if (summaryText.trim()) {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'summary',
          sectionTitle: getSectionTitle('summary'),
          text: summaryText,
          enhancedText: '',
          status: 'original',
          type: 'summary'
        });
      }
    }

    // Skills
    if (sections.skills?.blocks) {
      sections.skills.blocks.forEach((skillBlock: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'skills',
          sectionTitle: getSectionTitle('skills'),
          text: skillBlock.text,
          enhancedText: '',
          status: 'original',
          type: 'skill'
        });
      });
    }

    // Experience
    if (sections.experience?.jobs) {
      sections.experience.jobs.forEach((job: any, jobIdx: number) => {
        job.bullets.forEach((bullet: string) => {
          newBlocks.push({
            id: `block-${blockId++}`,
            sectionKey: 'experience',
            sectionTitle: getSectionTitle('experience'),
            jobIndex: jobIdx,
            jobTitle: job.title,
            text: bullet,
            enhancedText: '',
            status: 'original',
            type: 'bullet'
          });
        });
      });
    }

    // Projects
    if (sections.projects?.blocks) {
      sections.projects.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'projects',
          sectionTitle: getSectionTitle('projects'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
      });
    }

    // Certifications
    if (sections.certifications?.blocks) {
      sections.certifications.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'certifications',
          sectionTitle: getSectionTitle('certifications'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
      });
    }

    // Awards
    if (sections.awards?.blocks) {
      sections.awards.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'awards',
          sectionTitle: getSectionTitle('awards'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
      });
    }

    setBlocks(newBlocks);
  };

  // BATCH ENHANCE ALL - Skip education!
  const handleEnhanceAll = async () => {
    if (!jobDescription || !apiKey) {
      alert('Please provide job description and API key');
      return;
    }

    setIsLoading(true);

    // Only count blocks that will be enhanced (exclude education)
    const enhanceableBlocks = blocks.filter(b => b.sectionKey !== 'education');
    setEnhancementProgress({ current: 0, total: enhanceableBlocks.length });

    try {
      let processed = 0;
      for (const block of enhanceableBlocks) {
        processed++;
        setEnhancementProgress({ current: processed, total: enhanceableBlocks.length });

        try {
          const result = await api.enhanceResume(
            block.text,
            jobDescription,
            provider,
            model,
            apiKey
          );

          if (result.success) {
            setBlocks(prev => prev.map(b =>
              b.id === block.id
                ? { ...b, enhancedText: result.enhanced_resume, status: 'enhanced' }
                : b
            ));
          }
        } catch (error) {
          console.error(`Error enhancing block ${block.id}:`, error);
        }
      }
    } finally {
      setIsLoading(false);
      setEnhancementProgress({ current: 0, total: 0 });
    }
  };

  const handleAccept = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, status: 'accepted' } : b
    ));
  };

  const handleReject = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, status: 'rejected' } : b
    ));
  };

  const handleAcceptAll = () => {
    setBlocks(blocks.map(b =>
      b.enhancedText ? { ...b, status: 'accepted' } : b
    ));
  };

  const handleRejectAll = () => {
    setBlocks(blocks.map(b => ({ ...b, status: 'rejected' })));
  };

  // Show upload UI
  if (!originalResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ✏️ Interactive Studio
                </h1>
                <p className="text-sm text-gray-500 mt-1">Batch enhance • Review • Accept/Reject</p>
              </div>
              <div className="text-sm text-gray-500">
                Using: <span className="font-semibold text-purple-600">{provider}</span> • {model.split('-')[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-[1800px] mx-auto px-8 py-8">
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <FileUpload
              onFileUpload={handleFileUpload}
              onJobDescriptionChange={setJobDescription}
              jobDescription={jobDescription}
              isLoading={isLoading}
              uploadedFileName={uploadedFileName}
            />
          </div>
        </div>
      </div>
    );
  }

  const enhancedCount = blocks.filter(b => b.enhancedText).length;
  const acceptedCount = blocks.filter(b => b.status === 'accepted').length;
  const rejectedCount = blocks.filter(b => b.status === 'rejected').length;

  // Group blocks by section
  const groupedBlocks = blocks.reduce((acc, block) => {
    if (!acc[block.sectionKey]) {
      acc[block.sectionKey] = [];
    }
    acc[block.sectionKey].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✏️ Interactive Studio
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {enhancedCount > 0 ? `${acceptedCount} accepted • ${rejectedCount} rejected • ${enhancedCount - acceptedCount - rejectedCount} pending` : 'Click "Enhance All" to start'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Using: <span className="font-semibold text-purple-600">{provider}</span> • {model.split('-')[0]}
              </div>
              <button
                onClick={() => setIsEditingJD(!isEditingJD)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
              >
                {isEditingJD ? '💾 Save JD' : '📝 Edit JD'}
              </button>
              <button
                onClick={() => {
                  setOriginalResume(null);
                  setBlocks([]);
                  setUploadedFileName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors shadow-sm"
              >
                🔄 Re-upload
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* JD Edit Area */}
      {isEditingJD && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200 px-8 py-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📋 Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-40 px-4 py-3 border-2 border-blue-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Paste job description..."
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleEnhanceAll}
              disabled={isLoading || enhancedCount === blocks.filter(b => b.sectionKey !== 'education').length}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {isLoading ? `Enhancing ${enhancementProgress.current}/${enhancementProgress.total}...` : '✨ Enhance All'}
            </button>

            {enhancedCount > 0 && (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                >
                  ✓ Accept All
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors shadow-sm"
                >
                  ✗ Reject All
                </button>
              </>
            )}
          </div>

          {acceptedCount > 0 && (
            <button
              onClick={() => {
                const finalText = blocks.map(b =>
                  b.status === 'accepted' && b.enhancedText ? b.enhancedText : b.text
                ).join('\n\n');

                const blob = new Blob([finalText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'enhanced_resume_final.txt';
                a.click();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              📥 Download Final Resume
            </button>
          )}
        </div>
      </div>

      {/* Main Content: 2 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Grouped Suggestions */}
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">
            📝 Review Enhancements ({enhancedCount}/{blocks.filter(b => b.sectionKey !== 'education').length} enhanced)
          </h3>

          {/* Render sections in groups */}
          {Object.entries(groupedBlocks).map(([sectionKey, sectionBlocks]) => (
            <div key={sectionKey} className="mb-8">
              {/* Section Header Box */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-3 mb-3">
                <h4 className="text-base font-bold text-purple-900 uppercase tracking-wide">
                  {sectionBlocks[0].sectionTitle}
                  {sectionKey === 'education' && (
                    <span className="ml-2 text-xs font-normal text-purple-700 bg-purple-200 px-2 py-1 rounded">
                      Display Only (Not Enhanced)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-purple-700 mt-1">
                  {sectionBlocks.length} {sectionBlocks.length === 1 ? 'block' : 'blocks'}
                </p>
              </div>

              {/* Blocks in this section */}
              {sectionBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`mb-3 p-4 rounded-lg border-2 transition-all ${
                    block.status === 'accepted' 
                      ? 'border-green-500 bg-green-50' 
                      : block.status === 'rejected'
                      ? 'border-gray-300 bg-gray-50'
                      : block.enhancedText
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Job Title (for experience) */}
                  {block.jobTitle && (
                    <div className="text-xs text-gray-600 mb-2 font-medium">
                      → {block.jobTitle}
                    </div>
                  )}

                  {/* Original */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Original:</label>
                    <p className="text-sm text-gray-800 leading-relaxed">{block.text}</p>
                  </div>

                  {/* Enhanced (if available) */}
                  {block.enhancedText && (
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-green-700 uppercase mb-1 block">Enhanced:</label>
                      <p className="text-sm text-gray-800 leading-relaxed bg-green-100 p-2 rounded">{block.enhancedText}</p>
                    </div>
                  )}

                  {/* Actions - Only for non-education sections */}
                  {sectionKey !== 'education' && block.enhancedText && block.status !== 'accepted' && block.status !== 'rejected' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(block.id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 text-sm"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleReject(block.id)}
                        className="flex-1 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500 text-sm"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {/* Status Badge */}
                  {block.status === 'accepted' && (
                    <div className="mt-3 text-center text-sm font-semibold text-green-700 bg-green-200 py-2 rounded">
                      ✓ Accepted
                    </div>
                  )}
                  {block.status === 'rejected' && (
                    <div className="mt-3 text-center text-sm font-semibold text-gray-700 bg-gray-200 py-2 rounded">
                      ✗ Rejected (Using Original)
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT: Final Resume Preview */}
        <div className="w-1/2 bg-gradient-to-br from-gray-50 to-slate-50 overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">📄 Final Resume Preview</h3>

          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 min-h-[600px]">
            {/* Header */}
            {originalResume.sections.header?.lines && originalResume.sections.header.lines.length > 0 && (
              <div className="mb-6 pb-4 border-b-2 border-gray-300">
                {originalResume.sections.header.lines.map((line, idx) => (
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

            {/* Render each section */}
            {['summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'awards'].map(sectionKey => {
              const sectionBlocks = groupedBlocks[sectionKey];
              if (!sectionBlocks || sectionBlocks.length === 0) return null;

              return (
                <div key={sectionKey} className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
                    {sectionBlocks[0].sectionTitle}
                  </h3>

                  {sectionKey === 'experience' ? (
                    // Group by job
                    (() => {
                      const jobs = [...new Set(sectionBlocks.map(b => b.jobTitle))];
                      return jobs.map(jobTitle => (
                        <div key={jobTitle} className="mb-4">
                          <h4 className="text-sm font-bold text-gray-900 mb-2">{jobTitle}</h4>
                          {sectionBlocks
                            .filter(b => b.jobTitle === jobTitle)
                            .map(block => (
                              <div key={block.id} className="text-sm text-gray-800 mb-1 pl-4">
                                • {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                              </div>
                            ))
                          }
                        </div>
                      ));
                    })()
                  ) : (
                    // Regular blocks
                    sectionBlocks.map(block => (
                      <div key={block.id} className="text-sm text-gray-800 mb-1">
                        {sectionKey === 'skills' && '• '}
                        {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}