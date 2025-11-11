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
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
            {jobDescription}
          </pre>
        </div>
      </div>

      {/* Original Resume */}
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
          <pre className="whitespace-pre-wrap text-sm text-gray-900 enhanced-text">
            {resume.text}
          </pre>
        </div>
      </div>
    </div>
  );
}