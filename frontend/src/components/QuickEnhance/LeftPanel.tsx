'use client';

import { Resume } from '@/types';

interface LeftPanelProps {
  resume: Resume;
  jobDescription: string;
}

export default function LeftPanel({ resume, jobDescription }: LeftPanelProps) {
  return (
    <div className="space-y-6">
      {/* Job Description */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-4 flex items-center">
          <span className="text-2xl mr-2">📋</span> Job Description
        </h2>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200 max-h-72 overflow-y-auto custom-scrollbar">
          <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
            {jobDescription}
          </div>
        </div>
      </div>

      {/* Original Resume with proper structure */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <span className="text-2xl mr-2">📄</span> Original Resume
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {resume.word_count} words
            </span>
            <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              {resume.line_count} lines
            </span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-lg border-2 border-gray-200 max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="text-sm text-gray-900 space-y-1">
            {resume.text.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();

              // Detect different types of lines for proper formatting
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
                return (
                  <div key={idx} className="pl-4 leading-relaxed text-gray-800">
                    {line}
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="leading-relaxed text-gray-800">
                    {line}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}