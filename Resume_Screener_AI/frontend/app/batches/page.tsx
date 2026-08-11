'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UploadCloud, Eye, RefreshCw, Trash2, Wand2, CalendarDays, FileText, Layers } from 'lucide-react';
import { api, ProcessingJobResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export default function BatchesPage() {
  const [batches, setBatches] = useState<ProcessingJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reanalyzeId, setReanalyzeId] = useState<string | null>(null);
  const [reanalyzeJd, setReanalyzeJd] = useState('');
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.getBatches().then(setBatches).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this batch and all its candidates?')) return;
    setDeleting(id);
    try {
      await api.deleteBatch(id);
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleReanalyze = async (id: string) => {
    if (!reanalyzeJd.trim()) return;
    setReanalyzing(id);
    try {
      await api.reanalyzeBatch(id, reanalyzeJd);
      setReanalyzeId(null);
      setReanalyzeJd('');
      const poll = setInterval(async () => {
        try {
          const updated = await api.getBatch(id);
          setBatches((prev) => prev.map((b) => (b.id === id ? updated : b)));
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(poll);
            setReanalyzing(null);
            load();
          }
        } catch { clearInterval(poll); setReanalyzing(null); load(); }
      }, 2000);
    } catch (err) {
      console.error(err);
      setReanalyzing(null);
    }
  };

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      const result = await api.retryBatch(id);
      if (result.retried_count === 0) {
        alert('No failed files to retry');
      } else {
        load();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(null);
    }
  };

  const statusVariants: Record<string, 'success' | 'info' | 'secondary' | 'destructive'> = {
    completed: 'success',
    processing: 'info',
    pending: 'secondary',
    failed: 'destructive',
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Recruitment"
          title="Batch History"
          description="Track every bulk resume processing job, re-score with a new JD, or retry failed files."
          actions={
            <Link href="/bulk">
              <Button variant="gold" className="gap-1.5">
                <UploadCloud className="h-4 w-4" /> New Upload
              </Button>
            </Link>
          }
        />
      </Reveal>

      {batches.length === 0 ? (
        <Reveal>
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-lg shadow-gold/20">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">No batches yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload resumes via the Bulk Upload page</p>
            <Link href="/bulk">
              <Button variant="gold" className="mt-5 gap-1.5">
                <UploadCloud className="h-4 w-4" /> Upload resumes
              </Button>
            </Link>
          </div>
        </Reveal>
      ) : (
        <Stagger className="space-y-3.5" staggerChildren={0.05}>
          {batches.map((b) => {
            const progress = b.total_files > 0 ? Math.round((b.processed_files / b.total_files) * 100) : 0;
            return (
              <motion.div
                key={b.id}
                variants={staggerItem}
                className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-gold/40"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant={statusVariants[b.status] || 'secondary'} className="gap-1.5 capitalize">
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          b.status === 'completed' ? 'bg-emerald-400' : b.status === 'failed' ? 'bg-destructive' : b.status === 'processing' ? 'bg-sky-400' : 'bg-slate-400',
                        )} />
                        {b.status.replace('_', ' ')}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {b.job_description && (
                      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                        <span className="line-clamp-1">
                          <span className="font-medium">JD:</span> {b.job_description.substring(0, 140)}{b.job_description.length > 140 ? '...' : ''}
                        </span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{b.total_files} total</span>
                      <span className="text-emerald-500">{b.processed_files} done</span>
                      {b.failed_files > 0 && <span className="font-medium text-destructive">{b.failed_files} failed</span>}
                    </div>
                    {(b.status === 'processing' || b.status === 'pending') && (
                      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-secondary/60">
                        <div className="h-full rounded-full gold-gradient transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link href={`/candidates?batch_id=${b.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </Link>

                    {reanalyzeId === b.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          value={reanalyzeJd}
                          onChange={(e) => setReanalyzeJd(e.target.value)}
                          placeholder="New job description..."
                          className="h-8 w-44 text-xs"
                          disabled={reanalyzing === b.id}
                        />
                        <Button size="sm" onClick={() => handleReanalyze(b.id)} disabled={!reanalyzeJd.trim() || reanalyzing === b.id}>
                          {reanalyzing === b.id ? <span className="animate-pulse">…</span> : 'Go'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReanalyzeId(null); setReanalyzeJd(''); }} disabled={reanalyzing === b.id}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setReanalyzeId(b.id)} disabled={reanalyzing === b.id} className="gap-1.5">
                        <Wand2 className="h-3.5 w-3.5" />
                        {reanalyzing === b.id ? <span className="animate-pulse">…</span> : 'Re-analyze'}
                      </Button>
                    )}

                    {b.failed_files > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleRetry(b.id)} disabled={retrying === b.id} className="gap-1.5">
                        <RefreshCw className={cn('h-3.5 w-3.5', retrying === b.id && 'animate-spin')} />
                        {retrying === b.id ? '…' : 'Retry'}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      disabled={deleting === b.id}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting === b.id ? '…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
