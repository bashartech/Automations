'use client';

import { useState } from 'react';
import { api, MatchResponse } from '@/lib/api';
import ResultsDisplay from '@/components/ResultsDisplay';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  const handleFileUpload = (text: string, filename: string) => {
    setResumeText(text);
    setUploadedFileName(filename);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both resume text and job description');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const matchResults = await api.matchResume(resumeText, jobDescription);
      setResults(matchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResumeText('');
    setJobDescription('');
    setResults(null);
    setError(null);
    setUploadedFileName(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Resume Screener AI</h1>
          <p className="mt-2 text-gray-600">
            AI-powered resume analysis and job matching
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-lg font-semibold text-gray-950 mb-3">
              Resume
            </label>

            {/* Toggle between upload and text input */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Paste Text
              </button>
            </div>

            {inputMode === 'upload' ? (
              <div>
                <FileUpload onFileUpload={handleFileUpload} loading={loading} />
                {uploadedFileName && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Uploaded: <span className="font-semibold">{uploadedFileName}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {resumeText.length} characters extracted
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the resume text here..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            )}

            {/* Show extracted text preview if file was uploaded */}
            {inputMode === 'upload' && resumeText && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Extracted Text Preview:</p>
                <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {resumeText.substring(0, 500)}
                  {resumeText.length > 500 && '...'}
                </div>
              </div>
            )}
          </div>

          {/* Job Description Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-lg font-semibold text-gray-950 mb-3">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full text-gray-950 h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Reset
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
            <ResultsDisplay
              matchPercentage={results.match_percentage}
              matchedSkills={results.matched_skills}
              missingSkills={results.missing_skills}
              summary={results.summary}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            Powered by Gemini AI | Built with Next.js & FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
}
