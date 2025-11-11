'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onJobDescriptionChange: (jd: string) => void;
  jobDescription: string;
  isLoading: boolean;
}

export default function FileUpload({
  onFileUpload,
  onJobDescriptionChange,
  jobDescription,
  isLoading
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Resume Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="text-gray-600">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">📄 Drag & drop resume here</p>
                  <p className="text-sm">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">PDF or DOCX</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}