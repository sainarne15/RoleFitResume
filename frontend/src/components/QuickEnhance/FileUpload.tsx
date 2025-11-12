'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onJobDescriptionChange: (jd: string) => void;
  jobDescription: string;
  isLoading: boolean;
  uploadedFileName?: string;
}

export default function FileUpload({
  onFileUpload,
  onJobDescriptionChange,
  jobDescription,
  isLoading,
  uploadedFileName
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Resume Upload - Nice drag & drop box */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📄 Upload Resume
          </label>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : uploadedFileName
                ? 'border-green-400 bg-green-50 hover:border-green-500'
                : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-400 hover:bg-blue-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
            `}
          >
            <input {...getInputProps()} />

            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600 font-medium">Processing...</p>
              </div>
            ) : uploadedFileName ? (
              <div className="space-y-3">
                <div className="text-5xl">✅</div>
                <div>
                  <p className="text-green-700 font-semibold text-lg">Resume Loaded!</p>
                  <p className="text-green-600 text-sm mt-1">{uploadedFileName}</p>
                  <p className="text-gray-500 text-xs mt-2">Click to upload a different file</p>
                </div>
              </div>
            ) : isDragActive ? (
              <div className="space-y-3">
                <div className="text-5xl">📂</div>
                <p className="text-blue-600 font-semibold text-lg">Drop your resume here</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">📄</div>
                <div>
                  <p className="text-gray-700 font-semibold text-lg mb-1">
                    Drag & drop your resume
                  </p>
                  <p className="text-gray-500 text-sm">
                    or <span className="text-blue-600 font-medium">click to browse</span>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mt-4">
                  <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">DOCX</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">DOC</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📋 Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the full job description here...

Include:
• Job title and requirements
• Required skills and technologies
• Experience level needed
• Key responsibilities"
            className="w-full h-[200px] px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 transition-colors"
            disabled={isLoading}
          />
          {jobDescription && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Job description added ({jobDescription.split(/\s+/).length} words)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}