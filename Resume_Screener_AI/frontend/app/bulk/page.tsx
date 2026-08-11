'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FileArchive, FolderOpen, UploadCloud, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { api, authApi, ProcessingJobResponse, JobResponse, getCompanyId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { Reveal } from '@/components/motion/reveal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bulk_job_id';

type UploadMode = 'zip' | 'folder';

export default function BulkUploadPage() {
  const [, setCompId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [mode, setMode] = useState<UploadMode>('zip');
  const [file, setFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<ProcessingJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    authApi.me().then(u => {
      const cid = u.company_id || getCompanyId();
      if (cid) {
        setCompId(cid);
        api.getJobs(cid).then(setJobs).catch(() => {});
      }
    }).catch(() => {});
  }, []);

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
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="AI Tooling"
          title="Bulk Resume Upload"
          description="Upload resumes via ZIP or folder. Each resume is OCR'd, a structured profile is extracted, and scored against the job description."
        />
      </Reveal>

      <Reveal y={18}>
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <div className="mb-5 flex gap-1.5 rounded-full border border-border/60 bg-background/40 p-1">
            <button
              onClick={() => setMode('zip')}
              className={cn(
                'flex cursor-pointer flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200',
                mode === 'zip' ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileArchive className="h-4 w-4" /> ZIP File
            </button>
            <button
              onClick={() => setMode('folder')}
              className={cn(
                'flex cursor-pointer flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200',
                mode === 'folder' ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FolderOpen className="h-4 w-4" /> Folder
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Select Existing Job (optional)</Label>
              <Select
                value={selectedJobId || undefined}
                onValueChange={(jid) => {
                  setSelectedJobId(jid);
                  if (jid) {
                    const j = jobs.find(j => j.id === jid);
                    if (j?.description) setJobDescription(j.description);
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Type manually below" /></SelectTrigger>
                <SelectContent>
                  {jobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.title} ({j.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Job Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here. Every resume will be scored against this JD."
                rows={5}
              />
              {jobDescription.trim() === '' && (
                <p className="text-xs text-destructive">Required — all resumes are scored against this job description</p>
              )}
            </div>

            {mode === 'zip' ? (
              <div className="space-y-1.5">
                <Label>ZIP File of Resumes</Label>
                <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-5 transition-colors duration-200 hover:border-gold/40">
                  <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold">
                      <UploadCloud className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium">
                      {file ? file.name : 'Choose a ZIP file'}
                    </span>
                    <span className="text-xs text-muted-foreground">Supported inside ZIP: {supportedFormats}</span>
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Select Folder Containing Resumes</Label>
                <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-5 transition-colors duration-200 hover:border-gold/40">
                  <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium">{folderName || 'Choose a folder'}</span>
                    <span className="text-xs text-muted-foreground">Supported: {supportedFormats}</span>
                    <input
                      type="file"
                      {...{ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>}
                      className="hidden"
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
                    />
                  </label>
                </div>
                {folderFiles.length > 0 && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {folderFiles.length} resume{folderFiles.length > 1 ? 's' : ''} found in &quot;{folderName}&quot;
                  </p>
                )}
              </div>
            )}

            <div className="pt-1">
              <Button variant="gold" onClick={handleUpload} disabled={uploading || !canUpload} className="gap-1.5">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </Button>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </div>
      </Reveal>

      {job && (
        <Reveal>
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <CheckCircle2 className="h-5 w-5 text-gold" /> Processing Status
              </h2>
              <Badge variant="info" className="capitalize">{job.status.replace('_', ' ')}</Badge>
            </div>
            <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-secondary/60">
              <div
                className="h-full rounded-full gold-gradient transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{job.total_files}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{job.processed_files}</p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{job.failed_files}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
            {job.status === 'completed' && job.processed_files + job.failed_files >= job.total_files && (
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">All candidates processed.</span>
                <Link href={`/candidates?batch_id=${job.id}`} className="inline-flex items-center gap-1 font-medium text-gold hover:underline">
                  View Candidates <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/batches" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline">
                  All Batches <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
