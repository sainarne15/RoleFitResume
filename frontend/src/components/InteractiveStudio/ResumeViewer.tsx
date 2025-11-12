'use client';

import { Resume } from '@/types';

interface ResumeViewerProps {
  resume: Resume;
  jobDescription: string;
  changes: Record<string, any>;
  currentSection: string;
  onSectionClick: (section: string) => void;
}

export default function ResumeViewer({
  resume,
  jobDescription,
  changes,
  currentSection,
  onSectionClick
}: ResumeViewerProps) {
  if (!resume) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <p className="text-gray-400 text-center py-12">No resume loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sticky top-24">
      {/* Job Description - Compact */}
      <div className="bg-white rounded-xl shadow-lg p-5 border border-blue-200">
        <h3 className="text-sm font-bold text-blue-700 mb-3 flex items-center">
          <span className="text-lg mr-2">📋</span> Job Description
        </h3>
        <div className="bg-blue-50 p-4 rounded-lg max-h-32 overflow-y-auto custom-scrollbar">
          <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
            {jobDescription}
          </div>
        </div>
      </div>

      {/* Original Resume - Full View */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <span className="text-2xl mr-2">📄</span> Your Resume
          </h2>
          <div className="flex gap-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {resume.word_count} words
            </span>
          </div>
        </div>

        {/* Resume Content */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-lg border-2 border-gray-200 max-h-[600px] overflow-y-auto custom-scrollbar">
          <div className="text-sm space-y-2">
            {Object.entries(resume.sections).map(([sectionKey, section]) => {
              if (!section.content && !section.jobs) return null;

              const isActive = currentSection === sectionKey;

              return (
                <div
                  key={sectionKey}
                  className={`transition-all ${isActive ? 'ring-2 ring-purple-500 rounded-lg p-3' : 'p-3'}`}
                  onClick={() => onSectionClick(sectionKey)}
                >
                  {/* Section Header */}
                  {section.content && (
                    <div>
                      {section.content.split('\n').map((line, idx) => {
                        const trimmedLine = line.trim();
                        const isHeader = /^[A-Z\s]{3,}$/.test(trimmedLine) ||
                                        /^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE|OBJECTIVE)/i.test(trimmedLine);
                        const isBullet = /^[•\-●○*►]/.test(trimmedLine);
                        const isEmpty = !trimmedLine;

                        if (isEmpty) return <div key={idx} className="h-1" />;

                        if (isHeader) {
                          return (
                            <div key={idx} className="font-bold text-base text-gray-900 mb-2 uppercase tracking-wide">
                              {line}
                            </div>
                          );
                        }

                        if (isBullet) {
                          // Check if this bullet has a change
                          const changeKey = `${sectionKey}-${idx}`;
                          const hasChange = changes[changeKey];

                          return (
                            <div
                              key={idx}
                              className={`pl-4 leading-relaxed py-1 rounded ${
                                hasChange?.status === 'accepted' ? 'bg-green-100 border-l-2 border-green-500' :
                                hasChange?.status === 'pending' ? 'bg-yellow-50 border-l-2 border-yellow-400' :
                                ''
                              }`}
                            >
                              {line}
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="leading-relaxed">
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Experience Section with Jobs */}
                  {sectionKey === 'experience' && section.jobs && (
                    <div className="space-y-4">
                      {section.jobs.map((job, jobIdx) => (
                        <div key={jobIdx} className="border-l-2 border-gray-300 pl-4 py-2">
                          <div className="font-semibold text-gray-900">{job.title}</div>
                          <div className="space-y-1 mt-2">
                            {job.bullets.map((bullet, bulletIdx) => {
                              const changeKey = `${sectionKey}-${jobIdx}-${bulletIdx}`;
                              const hasChange = changes[changeKey];

                              return (
                                <div
                                  key={bulletIdx}
                                  className={`text-sm leading-relaxed py-1 px-2 rounded ${
                                    hasChange?.status === 'accepted' ? 'bg-green-100 border-l-2 border-green-500' :
                                    hasChange?.status === 'pending' ? 'bg-yellow-50 border-l-2 border-yellow-400' :
                                    ''
                                  }`}
                                >
                                  {bullet}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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