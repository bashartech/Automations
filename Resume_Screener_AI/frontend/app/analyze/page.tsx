'use client';

import { useState } from 'react';
import { UploadCloud, Clipboard, RefreshCcw, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { api, MatchResponse } from '@/lib/api';
import ResultsDisplay from '@/components/ResultsDisplay';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export default function AnalyzePage() {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="AI Tooling"
          title="Analyze Resume"
          description="Score a single resume against any job description with AI-driven insights."
        />
      </Reveal>

      <Reveal y={18}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="glass-card flex flex-col rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                  <FileText className="h-4 w-4" />
                </span>
                <h2 className="font-display text-lg font-semibold tracking-tight">Resume</h2>
              </div>
              <div className="flex gap-1.5 rounded-full border border-border/60 bg-background/40 p-1">
                <button
                  onClick={() => setInputMode('upload')}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    inputMode === 'upload' ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <UploadCloud className="h-3.5 w-3.5" /> Upload
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    inputMode === 'text' ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Clipboard className="h-3.5 w-3.5" /> Paste
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div>
                <FileUpload onFileUpload={handleFileUpload} loading={loading} />
                {uploadedFileName && (
                  <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">
                      Uploaded: <span className="font-semibold">{uploadedFileName}</span>
                    </p>
                    <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">{resumeText.length} characters extracted</p>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the resume text here..."
                className="min-h-[16rem]"
              />
            )}

            {inputMode === 'upload' && resumeText && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Extracted Text Preview</p>
                <div className="max-h-40 overflow-y-auto rounded-xl border bg-background/50 p-3 text-sm text-muted-foreground">
                  {resumeText.substring(0, 500)}
                  {resumeText.length > 500 && '...'}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                <Clipboard className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight">Job Description</h2>
            </div>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[16rem]"
            />
          </div>
        </div>
      </Reveal>

      <Reveal y={14}>
        <div className="flex flex-wrap gap-3">
          <Button variant="gold" onClick={handleAnalyze} disabled={loading} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-1.5">
            <RefreshCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </Reveal>

      {error && (
        <Reveal>
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </Reveal>
      )}

      {results && (
        <Reveal>
          <div className="glass-card rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight">Analysis Results</h2>
            </div>
            <ResultsDisplay
              matchPercentage={results.match_percentage}
              matchedSkills={results.matched_skills}
              missingSkills={results.missing_skills}
              summary={results.summary}
            />
          </div>
        </Reveal>
      )}
    </div>
  );
}
