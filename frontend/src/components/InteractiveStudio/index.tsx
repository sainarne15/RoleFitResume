'use client';

import { useState, useEffect } from 'react';
import { Resume, ATSScore } from '@/types';
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
  jobIndex?: number;
  text: string;
  enhancedText: string;
  status: 'original' | 'enhanced' | 'accepted';
  type: 'summary' | 'skill' | 'bullet';
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
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Handle file upload
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

        // Convert to blocks
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

    // Summary section - entire summary as ONE block
    if (sections.summary?.blocks && sections.summary.blocks.length > 0) {
      const summaryText = sections.summary.blocks.map((b: any) => b.text).join(' ');
      if (summaryText.trim()) {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'summary',
          text: summaryText,
          enhancedText: '',
          status: 'original',
          type: 'summary'
        });
      }
    }

    // Skills section - each line is a block
    if (sections.skills?.blocks) {
      sections.skills.blocks.forEach((skillBlock: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'skills',
          text: skillBlock.text,
          enhancedText: '',
          status: 'original',
          type: 'skill'
        });
      });
    }

    // Experience section - each bullet is a block
    if (sections.experience?.jobs) {
      sections.experience.jobs.forEach((job: any, jobIdx: number) => {
        job.bullets.forEach((bullet: string) => {
          newBlocks.push({
            id: `block-${blockId++}`,
            sectionKey: 'experience',
            jobIndex: jobIdx,
            text: bullet,
            enhancedText: '',
            status: 'original',
            type: 'bullet'
          });
        });
      });
    }

    setBlocks(newBlocks);
  };

  // Enhance a block
  const handleEnhanceBlock = async (block: Block) => {
    if (!jobDescription || !apiKey) {
      alert('Please provide job description and API key');
      return;
    }

    setSelectedBlock(block);
    setIsLoading(true);

    try {
      const result = await api.enhanceResume(
        block.text,
        jobDescription,
        provider,
        model,
        apiKey
      );

      if (result.success) {
        setBlocks(blocks.map(b =>
          b.id === block.id
            ? { ...b, enhancedText: result.enhanced_resume, status: 'enhanced' }
            : b
        ));

        setSelectedBlock({
          ...block,
          enhancedText: result.enhanced_resume,
          status: 'enhanced'
        });
      }
    } catch (error) {
      console.error('Error enhancing block:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept enhancement
  const handleAccept = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, status: 'accepted' } : b
    ));
    setSelectedBlock(null);
  };

  // Reject enhancement
  const handleReject = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, enhancedText: '', status: 'original' } : b
    ));
    setSelectedBlock(null);
  };

  // Show upload UI if no resume - MATCHING QuickEnhance style
  if (!originalResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header - MATCHING QuickEnhance */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ✏️ Interactive Studio
                </h1>
                <p className="text-sm text-gray-500 mt-1">Point-by-point resume enhancement with live preview</p>
              </div>
              <div className="text-sm text-gray-500">
                Using: <span className="font-semibold text-purple-600">{provider}</span> • {model.split('-')[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-[1800px] mx-auto px-8 py-8">
          {/* Upload UI - EXACT same as QuickEnhance */}
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

  // Main 3-panel layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar - MATCHING QuickEnhance header style */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✏️ Interactive Studio
              </h1>
              <p className="text-sm text-gray-500 mt-1">Select blocks to enhance • Live preview</p>
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
                  setSelectedBlock(null);
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

      {/* JD Edit Area (when editing) */}
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

      {/* Main Content: 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Source Resume Structure */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">📋 Your Resume</h3>

          {/* Summary Section */}
          {blocks.filter(b => b.sectionKey === 'summary').length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">📝 Summary</h4>
              {blocks.filter(b => b.sectionKey === 'summary').map(block => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className={`p-4 mb-2 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedBlock?.id === block.id 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : block.status === 'accepted'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                    {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                  </p>
                  {block.status === 'accepted' && (
                    <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✓ Accepted
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skills Section */}
          {blocks.filter(b => b.sectionKey === 'skills').length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">🛠️ Skills</h4>
              {blocks.filter(b => b.sectionKey === 'skills').map(block => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className={`p-3 mb-2 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedBlock?.id === block.id 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : block.status === 'accepted'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <p className="text-sm text-gray-800">
                    {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                  </p>
                  {block.status === 'accepted' && (
                    <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✓ Accepted
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Experience Section */}
          {originalResume.sections.experience?.jobs && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">💼 Experience</h4>
              {originalResume.sections.experience.jobs.map((job: any, jobIdx: number) => (
                <div key={jobIdx} className="mb-4 pl-3 border-l-4 border-indigo-200">
                  <h5 className="text-sm font-bold text-gray-900 mb-2">{job.title}</h5>
                  {blocks.filter(b => b.sectionKey === 'experience' && b.jobIndex === jobIdx).map(block => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-3 mb-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedBlock?.id === block.id 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : block.status === 'accepted'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <p className="text-sm text-gray-800">
                        {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                      </p>
                      {block.status === 'accepted' && (
                        <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                          ✓ Accepted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: AI Suggestions */}
        <div className="w-1/3 bg-gradient-to-br from-purple-50 to-pink-50 border-r border-gray-200 overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">✨ AI Enhancement</h3>

          {!selectedBlock ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👈</div>
              <p className="text-gray-500 text-lg font-medium">Select a block from the left</p>
              <p className="text-gray-400 text-sm mt-2">Click any block to enhance it with AI</p>
            </div>
          ) : (
            <div>
              {/* Original */}
              <div className="mb-6">
                <label className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 block">
                  Original:
                </label>
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-gray-800 leading-relaxed">{selectedBlock.text}</p>
                </div>
              </div>

              {/* Enhanced (if available) */}
              {selectedBlock.enhancedText && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 block">
                    Enhanced:
                  </label>
                  <div className="p-4 bg-green-50 border-2 border-green-400 rounded-lg">
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedBlock.enhancedText}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {selectedBlock.status === 'original' && !selectedBlock.enhancedText && (
                  <button
                    onClick={() => handleEnhanceBlock(selectedBlock)}
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors shadow-sm"
                  >
                    {isLoading ? 'Enhancing...' : '✨ Enhance with AI'}
                  </button>
                )}

                {selectedBlock.enhancedText && selectedBlock.status !== 'accepted' && (
                  <>
                    <button
                      onClick={() => handleAccept(selectedBlock.id)}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                    >
                      ✓ Accept Enhancement
                    </button>
                    <button
                      onClick={() => handleReject(selectedBlock.id)}
                      className="w-full py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors shadow-sm"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                {selectedBlock.status === 'accepted' && (
                  <div className="text-center py-4 text-green-700 font-semibold bg-green-100 rounded-lg">
                    ✓ This block has been accepted!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM-RIGHT PANEL: Final Resume Preview */}
        <div className="w-1/3 bg-white overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">📄 Final Resume</h3>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-lg border-2 border-gray-200 min-h-[600px]">
            {/* Header/Contact Info */}
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

            {/* Summary */}
            {blocks.filter(b => b.sectionKey === 'summary').length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">SUMMARY</h4>
                {blocks.filter(b => b.sectionKey === 'summary').map(block => (
                  <p key={block.id} className="text-sm text-gray-800 leading-relaxed">
                    {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                  </p>
                ))}
              </div>
            )}

            {/* Skills */}
            {blocks.filter(b => b.sectionKey === 'skills').length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">SKILLS</h4>
                {blocks.filter(b => b.sectionKey === 'skills').map(block => (
                  <div key={block.id} className="text-sm text-gray-800 mb-1">
                    • {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {originalResume.sections.experience?.jobs && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">EXPERIENCE</h4>
                {originalResume.sections.experience.jobs.map((job: any, jobIdx: number) => (
                  <div key={jobIdx} className="mb-4">
                    <h5 className="text-sm font-bold text-gray-900 mb-2">{job.title}</h5>
                    {blocks.filter(b => b.sectionKey === 'experience' && b.jobIndex === jobIdx).map(block => (
                      <div key={block.id} className="text-sm text-gray-800 mb-1 pl-4">
                        • {block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={() => {
              const finalResume = blocks.map(b =>
                b.status === 'accepted' && b.enhancedText ? b.enhancedText : b.text
              ).join('\n\n');

              const blob = new Blob([finalResume], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'enhanced_resume_final.txt';
              a.click();
            }}
            className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            📥 Download Final Resume
          </button>
        </div>
      </div>
    </div>
  );
}