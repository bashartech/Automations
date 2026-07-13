'use client';

import { useState, useEffect, useRef } from 'react';
import { api, ProcessingJobResponse } from '@/lib/api';

const STORAGE_KEY = 'bulk_job_id';

type UploadMode = 'zip' | 'folder';

export default function BulkUploadPage() {
  const [mode, setMode] = useState<UploadMode>('zip');
  const [file, setFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<ProcessingJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supportedFormats = '.pdf, .docx, .png, .jpg, .jpeg, .bmp, .tiff, .txt';

  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (savedJobId) {
      startPolling(savedJobId);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startPolling(jobId: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setJob(null);
    intervalRef.current = setInterval(async () => {
      try {
        const status = await api.getBulkStatus(jobId);
        setJob(status);
        if (status.status === 'completed' || status.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 2000);
  }

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setJob(null);
    try {
      if (!jobDescription.trim()) {
        setError('Job Description is required for scoring');
        setUploading(false);
        return;
      }
      let result: { job_id: string; total_files: number; message: string; skipped_files?: string[]; skipped_count?: number };
      if (mode === 'zip') {
        if (!file) return;
        result = await api.bulkUpload(file, jobDescription);
      } else {
        if (folderFiles.length === 0) return;
        result = await api.bulkUploadFiles(folderFiles, jobDescription);
      }
      if (result.skipped_count && result.skipped_count > 0) {
        setError(`${result.skipped_count} file(s) skipped (unsupported format). Supported: ${supportedFormats}`);
      }
      localStorage.setItem(STORAGE_KEY, result.job_id);
      startPolling(result.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = (mode === 'zip' ? !!file : folderFiles.length > 0) && jobDescription.trim().length > 0;
  const progress = job ? Math.round((job.processed_files / job.total_files) * 100) : 0;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Resume Upload</h1>
      <p className="text-gray-500 mb-6">
        Upload resumes via ZIP or select a folder. Each resume is OCR'd, a structured profile is extracted, and scored against the job description.
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode('zip')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'zip' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ZIP File
          </button>
          <button
            onClick={() => setMode('folder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'folder' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Folder
          </button>
        </div>

        {/* Job Description input — REQUIRED for scoring */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here. Every resume will be scored against this JD. Without a JD, no scoring is possible."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 text-gray-950 focus:ring-blue-500 focus:border-transparent"
          />
          {jobDescription.trim() === '' && (
            <p className="text-xs text-red-500 mt-1">Required — all resumes are scored against this job description</p>
          )}
        </div>

        {/* ZIP input */}
        {mode === 'zip' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP File of Resumes
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Supported inside ZIP: {supportedFormats}</p>
          </div>
        )}

        {/* Folder input */}
        {mode === 'folder' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Folder Containing Resumes
            </label>
            <input
              type="file"
              {...{ webkitdirectory: "", directory: "" } as any}
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                const allowed = new Set(['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.txt']);
                const valid: File[] = [];
                for (const f of Array.from(files)) {
                  const ext = '.' + f.name.split('.').pop()?.toLowerCase();
                  if (allowed.has(ext) && !f.name.startsWith('._')) {
                    valid.push(f);
                  }
                }
                setFolderFiles(valid);
                setFolderName(files.length > 0 ? files[0].webkitRelativePath.split('/')[0] || 'folder' : '');
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {folderFiles.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {folderFiles.length} resume{folderFiles.length > 1 ? 's' : ''} found in &quot;{folderName}&quot;
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !canUpload}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload & Process'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {job && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Processing Status</h2>

          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="h-4 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{job.total_files}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{job.processed_files}</p>
              <p className="text-sm text-gray-500">Processed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{job.failed_files}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Status: <span className="font-medium capitalize">{job.status.replace('_', ' ')}</span>
          </p>

          {(job.status === 'completed') && (
            <div className="mt-2 text-sm text-green-600 space-x-3">
              <span>All candidates processed.</span>
              <a href={`/candidates?batch_id=${job.id}`} className="underline">View Candidates</a>
              <a href="/batches" className="underline text-gray-500">All Batches</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
