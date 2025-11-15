'use client';

import { useState, useEffect } from 'react';
import { Resume } from '@/types';
import { api } from '@/lib/api';
import FileUpload from '../QuickEnhance/FileUpload';

interface InteractiveStudioProps {
  sharedData?: any;
  provider: string;
  model: string;
  apiKey: string;
  globalApiKeys: Record<string, string>;
  onDataChange: (data: any) => void;
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
  globalApiKeys,
  onDataChange
}: InteractiveStudioProps) {
  const [originalResume, setOriginalResume] = useState<Resume | null>(sharedData?.resume || null);
  const [jobDescription, setJobDescription] = useState<string>(sharedData?.jobDescription || '');
  const [isLoading, setIsLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // ATS Score state
  const [originalScore, setOriginalScore] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  // Sync with shared data when switching modes
  useEffect(() => {
    if (sharedData?.resume) {
      setOriginalResume(sharedData.resume);
      convertToBlocks(sharedData.resume.sections);
    }
  }, [sharedData?.resume]);

  useEffect(() => {
    if (sharedData?.jobDescription) {
      setJobDescription(sharedData.jobDescription);
    }
  }, [sharedData?.jobDescription]);

  // Calculate ATS score whenever blocks or JD changes
  useEffect(() => {
    if (blocks.length > 0 && jobDescription.trim()) {
      calculateCurrentScore();
    }
  }, [blocks, jobDescription]);

  // Calculate initial score when resume is uploaded
  useEffect(() => {
    if (originalResume && jobDescription.trim() && blocks.length > 0) {
      calculateCurrentScore();
    }
  }, [originalResume, blocks.length]);

  const calculateCurrentScore = async () => {
    if (!jobDescription || blocks.length === 0) return;

    setIsCalculatingScore(true);
    try {
      // Build ORIGINAL resume (all original text)
      const originalResumeText = blocks.map(b => b.text).join('\n');

      // Build CURRENT/ENHANCED resume (accepted/enhanced text)
      const currentResumeText = blocks.map(b => {
        // For accepted blocks with enhancements
        if (b.status === 'accepted' && b.enhancedText) {
          return b.enhancedText;
        }
        // For enhanced blocks (not yet accepted/rejected)
        else if (b.enhancedText) {
          return b.enhancedText;
        }
        // Original text (including header)
        else {
          return b.text;
        }
      }).join('\n');

      console.log('Calculating BOTH scores...');

      // Calculate both scores in parallel
      const [originalScoreResult, currentScoreResult] = await Promise.all([
        api.calculateScore(originalResumeText, jobDescription),
        api.calculateScore(currentResumeText, jobDescription)
      ]);

      console.log('Original Score:', originalScoreResult);
      console.log('Current/Enhanced Score:', currentScoreResult);

      setOriginalScore(originalScoreResult.score);
      setCurrentScore(currentScoreResult.score);
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setUploadedFileName(file.name);

    try {
      const result = await api.extractDocument(file);

      if (result.success) {
        const resume = {
          text: result.text,
          sections: result.sections,
          word_count: result.word_count,
          line_count: result.line_count
        };
        setOriginalResume(resume);
        // Update parent with both resume and JD
        onDataChange({ resume, jobDescription });
        convertToBlocks(result.sections);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadedFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDescriptionChange = (jd: string) => {
    setJobDescription(jd);
    // Update parent immediately when JD changes
    if (originalResume) {
      onDataChange({ resume: originalResume, jobDescription: jd });
    }
  };

  const convertToBlocks = (sections: any) => {
    const newBlocks: Block[] = [];
    let blockId = 0;

    const getSectionTitle = (key: string) => {
      const titles: Record<string, string> = {
        'header': 'CONTACT INFORMATION',
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

    // Header/Contact Info
    if (sections.header?.lines && sections.header.lines.length > 0) {
      const contactText = sections.header.lines.join('\n');
      console.log('Header detected from sections.header.lines:', contactText);
      if (contactText.trim()) {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'header',
          sectionTitle: getSectionTitle('header'),
          text: contactText,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
        console.log('Header block created from sections.header.lines');
      }
    } else {
      console.log('No sections.header.lines found, checking sections object:', sections);

      // FALLBACK: Try to extract header from raw text if backend didn't parse it
      // Get first lines before any section keyword
      if (originalResume?.text) {
        const allLines = originalResume.text.split('\n');
        const headerLines: string[] = [];

        for (const line of allLines) {
          const lineLower = line.toLowerCase().trim();
          // Stop at first section keyword
          if (lineLower.includes('summary') || lineLower.includes('experience') ||
              lineLower.includes('education') || lineLower.includes('skills') ||
              lineLower.includes('objective') || lineLower.includes('profile')) {
            break;
          }
          if (line.trim()) {
            headerLines.push(line);
          }
          // Stop after 10 lines max
          if (headerLines.length >= 10) break;
        }

        if (headerLines.length > 0) {
          const contactText = headerLines.join('\n');
          console.log('Header extracted from raw text (fallback):', contactText);
          newBlocks.push({
            id: `block-${blockId++}`,
            sectionKey: 'header',
            sectionTitle: getSectionTitle('header'),
            text: contactText,
            enhancedText: '',
            status: 'original',
            type: 'text'
          });
          console.log('Header block created from fallback extraction');
        } else {
          console.warn('Could not extract header from raw text either');
        }
      }
    }

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

    // Education
    if (sections.education?.blocks) {
      sections.education.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'education',
          sectionTitle: getSectionTitle('education'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
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

    // Publications
    if (sections.publications?.blocks) {
      sections.publications.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'publications',
          sectionTitle: getSectionTitle('publications'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
      });
    }

    // Volunteer
    if (sections.volunteer?.blocks) {
      sections.volunteer.blocks.forEach((block: any) => {
        newBlocks.push({
          id: `block-${blockId++}`,
          sectionKey: 'volunteer',
          sectionTitle: getSectionTitle('volunteer'),
          text: block.text,
          enhancedText: '',
          status: 'original',
          type: 'text'
        });
      });
    }

    setBlocks(newBlocks);
    console.log('Total blocks created:', newBlocks.length);
    console.log('Blocks by section:', newBlocks.reduce((acc, b) => {
      acc[b.sectionKey] = (acc[b.sectionKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));

    // Trigger score calculation immediately after blocks are set
    if (jobDescription.trim() && newBlocks.length > 0) {
      console.log('Triggering ATS score calculation...');
      setTimeout(() => {
        calculateCurrentScore();
      }, 100); // Reduced to 100ms
    } else {
      console.log('Skipping score calculation:', { hasJD: !!jobDescription.trim(), blockCount: newBlocks.length });
    }
  };

  // SINGLE API CALL - Enhance all blocks at once!
  const handleEnhanceAll = async () => {
    if (!jobDescription || !apiKey) {
      alert('Please provide job description and API key');
      return;
    }

    setIsLoading(true);

    try {
      const enhanceableBlocks = blocks.filter(b =>
        b.sectionKey !== 'header' &&
        b.sectionKey !== 'education' &&
        b.sectionKey !== 'certifications'
      );

      const blocksText = enhanceableBlocks.map((block, idx) =>
        `[BLOCK ${idx + 1}]\n${block.text}`
      ).join('\n\n');

      const fullPrompt = `Job Description:
${jobDescription}

---

Below are ${enhanceableBlocks.length} resume blocks. Enhance each one to be more impactful and ATS-friendly based on the job description above.

Rules:
- Keep similar length (±10 words)
- Use strong action verbs
- Add metrics where possible
- Match job keywords naturally
- Stay professional

Resume blocks to enhance:

${blocksText}

---

Respond with enhanced blocks in this exact format:

[BLOCK 1]
<enhanced text>

[BLOCK 2]
<enhanced text>

Continue for all ${enhanceableBlocks.length} blocks.`;

      const result = await api.enhanceResume(
        fullPrompt,
        '',
        provider,
        model,
        apiKey
      );

      if (result.success) {
        const enhancedBlocks = parseEnhancedBlocks(result.enhanced_resume, enhanceableBlocks.length);

        let enhancedIdx = 0;
        const updatedBlocks = blocks.map(block => {
          if (block.sectionKey === 'header' || block.sectionKey === 'education' || block.sectionKey === 'certifications') {
            return block;
          }

          const enhanced = enhancedBlocks[enhancedIdx];
          enhancedIdx++;

          return {
            ...block,
            enhancedText: enhanced || block.text,
            status: 'enhanced' as const
          };
        });

        setBlocks(updatedBlocks);
      }
    } catch (error) {
      console.error('Error enhancing blocks:', error);
      alert('Error enhancing resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReEnhance = async () => {
    if (!jobDescription || !apiKey) {
      alert('Please provide job description and API key');
      return;
    }

    setIsLoading(true);

    try {
      const blocksToEnhance = blocks.filter(b =>
        b.sectionKey !== 'header' &&
        b.sectionKey !== 'education' &&
        b.sectionKey !== 'certifications' &&
        (b.status === 'rejected' || (b.status === 'enhanced' && !b.enhancedText))
      );

      if (blocksToEnhance.length === 0) {
        alert('No blocks to re-enhance. All blocks are already accepted or enhanced.');
        setIsLoading(false);
        return;
      }

      const blocksText = blocksToEnhance.map((block, idx) =>
        `[BLOCK ${idx + 1}]\n${block.text}`
      ).join('\n\n');

      const fullPrompt = `Job Description:
${jobDescription}

---

Enhance these ${blocksToEnhance.length} resume blocks to match the job description. Keep similar length, use action verbs, add metrics.

${blocksText}

---

Format:
[BLOCK 1]
<enhanced>

[BLOCK 2]
<enhanced>`;

      const result = await api.enhanceResume(fullPrompt, '', provider, model, apiKey);

      if (result.success) {
        const enhancedBlocks = parseEnhancedBlocks(result.enhanced_resume, blocksToEnhance.length);

        let enhancedIdx = 0;
        const updatedBlocks = blocks.map(block => {
          const shouldUpdate = blocksToEnhance.find(b => b.id === block.id);
          if (shouldUpdate) {
            const enhanced = enhancedBlocks[enhancedIdx];
            enhancedIdx++;
            return {
              ...block,
              enhancedText: enhanced || block.text,
              status: 'enhanced' as const
            };
          }
          return block;
        });

        setBlocks(updatedBlocks);
      }
    } catch (error) {
      console.error('Error re-enhancing blocks:', error);
      alert('Error re-enhancing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseEnhancedBlocks = (response: string, expectedCount: number): string[] => {
    const blocks: string[] = [];
    const blockPattern = /\[BLOCK \d+\]\s*\n([\s\S]*?)(?=\[BLOCK \d+\]|$)/g;
    let match;

    while ((match = blockPattern.exec(response)) !== null) {
      const blockText = match[1].trim();
      if (blockText) {
        blocks.push(blockText);
      }
    }

    if (blocks.length === 0) {
      const fallbackBlocks = response.split(/\n\n+/).filter(b => b.trim() && !b.startsWith('[BLOCK'));
      return fallbackBlocks.slice(0, expectedCount);
    }

    return blocks;
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

  const handleEdit = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    setEditingBlockId(blockId);
    setEditingText(block.enhancedText || block.text);
  };

  const handleSaveEdit = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, enhancedText: editingText.trim(), status: 'enhanced' } : b
    ));
    setEditingBlockId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditingText('');
  };

  const handleChangeDecision = (blockId: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, status: 'enhanced' } : b
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
                <p className="text-sm text-gray-500 mt-1">Single API call • Fast & efficient</p>
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
              onJobDescriptionChange={handleJobDescriptionChange}
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
  const pendingCount = blocks.filter(b =>
    b.sectionKey !== 'header' &&
    b.sectionKey !== 'education' &&
    b.sectionKey !== 'certifications' &&
    b.status !== 'accepted' &&
    b.status !== 'rejected'
  ).length;
  const totalEnhanceable = blocks.filter(b =>
    b.sectionKey !== 'header' &&
    b.sectionKey !== 'education' &&
    b.sectionKey !== 'certifications'
  ).length;

  const groupedBlocks = blocks.reduce((acc, block) => {
    if (!acc[block.sectionKey]) {
      acc[block.sectionKey] = [];
    }
    acc[block.sectionKey].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with ATS Score */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✏️ Interactive Studio
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {enhancedCount > 0
                  ? `${acceptedCount} accepted • ${rejectedCount} rejected • ${pendingCount} pending`
                  : 'Click "Enhance All" to start'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* ATS Score Badges - Both Original and Current */}
              {isCalculatingScore ? (
                <div className="px-5 py-3 rounded-lg font-bold text-lg bg-gray-100 text-gray-700 border-2 border-gray-300">
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Calculating Scores...
                  </span>
                </div>
              ) : (originalScore > 0 || currentScore > 0) ? (
                <div className="flex items-center gap-3">
                  {/* Original Score */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1 font-semibold">ORIGINAL</div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                      originalScore >= 80 ? 'bg-green-100 text-green-700 border-2 border-green-300' : 
                      originalScore >= 60 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 
                      'bg-red-100 text-red-700 border-2 border-red-300'
                    }`}>
                      {originalScore}%
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-2xl text-gray-400">→</div>

                  {/* Current/Enhanced Score */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1 font-semibold">ENHANCED</div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                      currentScore >= 80 ? 'bg-green-100 text-green-700 border-2 border-green-300' : 
                      currentScore >= 60 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 
                      'bg-red-100 text-red-700 border-2 border-red-300'
                    }`}>
                      {currentScore}%
                    </div>
                  </div>

                  {/* Improvement Indicator */}
                  {currentScore > originalScore && (
                    <div className="ml-2 text-green-600 font-bold text-sm">
                      +{(currentScore - originalScore).toFixed(1)}% ⬆
                    </div>
                  )}
                </div>
              ) : null}
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
                  setOriginalScore(0);
                  setCurrentScore(0);
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
            onChange={(e) => handleJobDescriptionChange(e.target.value)}
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
              disabled={isLoading || enhancedCount === totalEnhanceable}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {isLoading ? 'Enhancing all blocks...' : '✨ Enhance All'}
            </button>

            {enhancedCount > 0 && (
              <>
                <button
                  onClick={handleReEnhance}
                  disabled={isLoading}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 transition-colors shadow-sm"
                >
                  🔄 Re-Enhance Rejected
                </button>
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
                let finalText = '';
                const grouped = blocks.reduce((acc, b) => {
                  if (!acc[b.sectionKey]) acc[b.sectionKey] = [];
                  acc[b.sectionKey].push(b);
                  return acc;
                }, {} as Record<string, Block[]>);

                const sectionOrder = ['header', 'summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'awards', 'publications', 'volunteer', 'languages', 'interests'];

                sectionOrder.forEach(sectionKey => {
                  const sectionBlocks = grouped[sectionKey];
                  if (!sectionBlocks || sectionBlocks.length === 0) return;

                  if (sectionKey !== 'header') {
                    finalText += `\n${sectionBlocks[0].sectionTitle}\n`;
                    finalText += '─'.repeat(sectionBlocks[0].sectionTitle.length) + '\n\n';
                  }

                  if (sectionKey === 'experience') {
                    const jobs = [...new Set(sectionBlocks.map(b => b.jobTitle))];
                    jobs.forEach(jobTitle => {
                      finalText += `${jobTitle}\n`;
                      sectionBlocks
                        .filter(b => b.jobTitle === jobTitle)
                        .forEach(block => {
                          const text = block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text;
                          // Don't add bullet if text already starts with one
                          const displayText = text.trim().startsWith('•') ? text : `• ${text}`;
                          finalText += `${displayText}\n`;
                        });
                      finalText += '\n';
                    });
                  } else if (sectionKey === 'header') {
                    sectionBlocks.forEach(block => {
                      const text = block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text;
                      finalText += `${text}\n`;
                    });
                    finalText += '\n';
                  } else {
                    sectionBlocks.forEach(block => {
                      const text = block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text;
                      if (sectionKey === 'skills') {
                        // Don't add bullet if text already starts with one
                        const displayText = text.trim().startsWith('•') ? text : `• ${text}`;
                        finalText += `${displayText}\n`;
                      } else {
                        finalText += `${text}\n`;
                      }
                    });
                    finalText += '\n';
                  }
                });

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
            📝 Review Enhancements ({enhancedCount}/{totalEnhanceable} enhanced)
          </h3>

          {Object.entries(groupedBlocks).map(([sectionKey, sectionBlocks]) => (
            <div key={sectionKey} className="mb-8">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-3 mb-3">
                <h4 className="text-base font-bold text-purple-900 uppercase tracking-wide">
                  {sectionBlocks[0].sectionTitle}
                  {(sectionKey === 'header' || sectionKey === 'education' || sectionKey === 'certifications') && (
                    <span className="ml-2 text-xs font-normal text-purple-700 bg-purple-200 px-2 py-1 rounded">
                      Edit Only (Not Enhanced)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-purple-700 mt-1">
                  {sectionBlocks.length} {sectionBlocks.length === 1 ? 'block' : 'blocks'}
                </p>
              </div>

              {sectionKey === 'experience' ? (
                (() => {
                  const jobs = [...new Set(sectionBlocks.map(b => b.jobTitle))];
                  return jobs.map(jobTitle => {
                    const jobBlocks = sectionBlocks.filter(b => b.jobTitle === jobTitle);
                    return (
                      <div key={jobTitle} className="mb-4">
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-2 mb-2">
                          <h5 className="text-sm font-bold text-indigo-900">{jobTitle}</h5>
                          <p className="text-xs text-indigo-600 mt-1">
                            {jobBlocks.length} {jobBlocks.length === 1 ? 'bullet' : 'bullets'}
                          </p>
                        </div>

                        {jobBlocks.map((block) => (
                          <div
                            key={block.id}
                            className={`mb-3 ml-4 p-4 rounded-lg border-2 transition-all ${
                              block.status === 'accepted' 
                                ? 'border-green-500 bg-green-50' 
                                : block.status === 'rejected'
                                ? 'border-gray-300 bg-gray-50'
                                : block.enhancedText
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Original:</label>
                              <p className="text-sm text-gray-800 leading-relaxed">{block.text}</p>
                            </div>

                            {block.enhancedText && (
                              <div className="mb-3">
                                <label className="text-xs font-semibold text-green-700 uppercase mb-1 block">Enhanced:</label>
                                {editingBlockId === block.id ? (
                                  <div>
                                    <textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      className="w-full h-32 px-3 py-2 border-2 border-blue-400 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleSaveEdit(block.id)}
                                        className="flex-1 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                                      >
                                        💾 Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
                                      >
                                        ✗ Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-800 leading-relaxed bg-green-100 p-2 rounded">{block.enhancedText}</p>
                                )}
                              </div>
                            )}

                            {block.enhancedText && block.status === 'enhanced' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleAccept(block.id)}
                                  className="flex-1 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 text-sm"
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => handleEdit(block.id)}
                                  className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleReject(block.id)}
                                  className="flex-1 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500 text-sm"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}

                            {block.status === 'accepted' && (
                              <div className="mt-3">
                                <div className="text-center text-sm font-semibold text-green-700 bg-green-200 py-2 rounded mb-2">
                                  ✓ Accepted
                                </div>
                                <button
                                  onClick={() => handleChangeDecision(block.id)}
                                  className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Change decision
                                </button>
                              </div>
                            )}
                            {block.status === 'rejected' && (
                              <div className="mt-3">
                                <div className="text-center text-sm font-semibold text-gray-700 bg-gray-200 py-2 rounded mb-2">
                                  ✗ Rejected (Using Original)
                                </div>
                                <button
                                  onClick={() => handleChangeDecision(block.id)}
                                  className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Change decision
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()
              ) : (
                sectionBlocks.map((block) => (
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
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Original:</label>
                      <p className="text-sm text-gray-800 leading-relaxed">{block.text}</p>
                    </div>

                    {block.enhancedText && (
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-green-700 uppercase mb-1 block">Enhanced:</label>
                        {editingBlockId === block.id ? (
                          <div>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full h-32 px-3 py-2 border-2 border-blue-400 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(block.id)}
                                className="flex-1 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                              >
                                💾 Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
                              >
                                ✗ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-800 leading-relaxed bg-green-100 p-2 rounded">{block.enhancedText}</p>
                        )}
                      </div>
                    )}

                    {sectionKey !== 'header' && sectionKey !== 'education' && sectionKey !== 'certifications' && block.enhancedText && block.status === 'enhanced' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAccept(block.id)}
                          className="flex-1 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 text-sm"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleEdit(block.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleReject(block.id)}
                          className="flex-1 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500 text-sm"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {(sectionKey === 'header' || sectionKey === 'education' || sectionKey === 'certifications') && (
                      <div className="mt-3">
                        {editingBlockId === block.id ? (
                          <div>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full h-32 px-3 py-2 border-2 border-blue-400 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setBlocks(prev => prev.map(b =>
                                    b.id === block.id ? { ...b, text: editingText.trim(), status: 'accepted' } : b
                                  ));
                                  setEditingBlockId(null);
                                  setEditingText('');
                                }}
                                className="flex-1 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                              >
                                💾 Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
                              >
                                ✗ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingBlockId(block.id);
                              setEditingText(block.text);
                            }}
                            className="w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm"
                          >
                            ✏️ Edit Only
                          </button>
                        )}
                      </div>
                    )}

                    {block.status === 'accepted' && (
                      <div className="mt-3">
                        <div className="text-center text-sm font-semibold text-green-700 bg-green-200 py-2 rounded mb-2">
                          ✓ Accepted
                        </div>
                        <button
                          onClick={() => handleChangeDecision(block.id)}
                          className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change decision
                        </button>
                      </div>
                    )}
                    {block.status === 'rejected' && (
                      <div className="mt-3">
                        <div className="text-center text-sm font-semibold text-gray-700 bg-gray-200 py-2 rounded mb-2">
                          ✗ Rejected (Using Original)
                        </div>
                        <button
                          onClick={() => handleChangeDecision(block.id)}
                          className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change decision
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* RIGHT: Final Resume Preview */}
        <div className="w-1/2 bg-gradient-to-br from-gray-50 to-slate-50 overflow-y-auto p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">📄 Final Resume Preview</h3>

          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 min-h-[600px]">
            {/* Render each section including header */}
            {['header', 'summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'awards', 'publications', 'volunteer', 'languages', 'interests'].map(sectionKey => {
              const sectionBlocks = groupedBlocks[sectionKey];
              if (!sectionBlocks || sectionBlocks.length === 0) return null;

              return (
                <div key={sectionKey} className="mb-6">
                  {sectionKey === 'header' ? (
                    // Header/Contact - centered, no section title
                    <div className="mb-6 pb-4 border-b-2 border-gray-300">
                      {sectionBlocks.map((block, idx) => {
                        const lines = block.text.split('\n');
                        return lines.map((line, lineIdx) => (
                          <div key={`${idx}-${lineIdx}`} className="text-center">
                            {lineIdx === 0 ? (
                              <h2 className="text-2xl font-bold text-gray-900">{line}</h2>
                            ) : (
                              <p className="text-sm text-gray-700">{line}</p>
                            )}
                          </div>
                        ));
                      })}
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
                        {sectionBlocks[0].sectionTitle}
                      </h3>

                      {sectionKey === 'experience' ? (
                        (() => {
                          const jobs = [...new Set(sectionBlocks.map(b => b.jobTitle))];
                          return jobs.map(jobTitle => (
                            <div key={jobTitle} className="mb-4">
                              <h4 className="text-sm font-bold text-gray-900 mb-2">{jobTitle}</h4>
                              {sectionBlocks
                                .filter(b => b.jobTitle === jobTitle)
                                .map(block => {
                                  const text = block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text;
                                  // Don't add bullet if text already starts with one
                                  const displayText = text.trim().startsWith('•') ? text : `• ${text}`;
                                  return (
                                    <div key={block.id} className="text-sm text-gray-800 mb-1 pl-4">
                                      {displayText}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          ));
                        })()
                      ) : (
                        sectionBlocks.map(block => {
                          const text = block.status === 'accepted' && block.enhancedText ? block.enhancedText : block.text;
                          // Don't add bullet if text already starts with one
                          const displayText = sectionKey === 'skills' && !text.trim().startsWith('•') ? `• ${text}` : text;
                          return (
                            <div key={block.id} className="text-sm text-gray-800 mb-1">
                              {displayText}
                            </div>
                          );
                        })
                      )}
                    </>
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