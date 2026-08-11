'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Download, CheckSquare, ArrowRight } from 'lucide-react';
import { api, CandidateProfile, ProcessingJobResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

function CandidatesContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume_id') || undefined;
  const batchIdParam = searchParams.get('batch_id') || undefined;
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [batches, setBatches] = useState<ProcessingJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(batchIdParam || '');
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareModal, setCompareModal] = useState<CandidateProfile[] | null>(null);

  function load() {
    setLoading(true);
    api.getCandidates(
      categoryFilter || undefined,
      resumeId,
      selectedBatch || undefined,
      minScore > 0 ? minScore : undefined,
      statusFilter || undefined,
      searchQuery || undefined,
    ).then(setCandidates).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    api.getBatches().then(setBatches).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [categoryFilter, resumeId, selectedBatch, minScore, statusFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedIds.size} candidates?`)) return;
      await api.bulkDeleteCandidates(Array.from(selectedIds));
      setSelectedIds(new Set());
      load();
    } else if (bulkAction === 'export') {
      await api.exportCsv({ batchId: selectedBatch || undefined });
    } else if (bulkAction.startsWith('status:')) {
      const s = bulkAction.replace('status:', '');
      await api.bulkUpdateStatus(Array.from(selectedIds), s);
      setSelectedIds(new Set());
      load();
    } else if (bulkAction === 'compare') {
      const ids = Array.from(selectedIds);
      if (ids.length < 2) return;
      setComparing(true);
      try {
        const profiles = await api.compareCandidates(ids);
        setCompareModal(profiles);
      } catch (e: any) { alert(e.message); }
      finally { setComparing(false); }
    }
  };

  const categoryVariants: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> = {
    strong_match: 'success',
    good_match: 'info',
    average_match: 'warning',
    weak_match: 'destructive',
    reject: 'destructive',
  };

  const statusVariants: Record<string, 'secondary' | 'info' | 'success' | 'destructive'> = {
    new: 'secondary',
    shortlisted: 'info',
    interviewed: 'info',
    hired: 'success',
    rejected: 'destructive',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talent pool"
        title="Candidates"
        description="Browse, filter and shortlist every screened candidate."
        actions={
          <>
            {selectedIds.size > 0 && (
              <span className="self-center text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => api.exportCsv({ batchId: selectedBatch || undefined, category: categoryFilter || undefined, minScore: minScore || undefined, status: statusFilter || undefined })}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search candidates by name, email, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['', 'strong_match', 'good_match', 'average_match', 'weak_match', 'reject'].map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'gold' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
            className="capitalize"
          >
            {cat ? cat.replace('_', ' ') : 'All'}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Min score:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-20 accent-gold"
          />
          <span className="w-6 text-xs font-medium">{minScore}%</span>
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-32 text-xs">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedBatch} onValueChange={(v) => setSelectedBatch(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-48 text-xs">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {new Date(b.created_at).toLocaleDateString()} — {b.total_files} files
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gold-soft/30 px-4 py-2.5"
        >
          <CheckSquare className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder="Bulk actions..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Delete selected</SelectItem>
              <SelectItem value="export">Export selected</SelectItem>
              <SelectItem value="compare">Compare selected</SelectItem>
              <SelectItem value="status:shortlisted">Mark shortlisted</SelectItem>
              <SelectItem value="status:interviewed">Mark interviewed</SelectItem>
              <SelectItem value="status:hired">Mark hired</SelectItem>
              <SelectItem value="status:rejected">Mark rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction || comparing} variant="gold">
            {comparing ? 'Comparing...' : 'Apply'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </motion.div>
      )}

      {loading ? (
        <PageLoader className="min-h-[40vh]" />
      ) : candidates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={selectedIds.size === candidates.length && candidates.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded accent-gold"
            />
            <span>Select all ({candidates.length})</span>
          </div>

          <Stagger className="space-y-3" staggerChildren={0.04}>
            {candidates.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <motion.div
                  key={c.id}
                  variants={staggerItem}
                  className={cn(
                    'glass-card group relative flex items-start gap-4 rounded-2xl p-5 transition-all duration-300',
                    isSelected ? 'gold-ring' : 'hover:-translate-y-0.5',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(c.id)}
                    className="mt-1.5 h-4 w-4 shrink-0 rounded accent-gold"
                  />
                  <Link href={`/candidates/${c.id}`} className="flex min-w-0 flex-1 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight">{c.name || 'Unnamed Candidate'}</h3>
                        {c.status && (
                          <Badge variant={statusVariants[c.status] || 'secondary'} className="text-[10px]">
                            {c.status}
                          </Badge>
                        )}
                      </div>
                      {c.email && <p className="mt-0.5 text-sm text-muted-foreground">{c.email}</p>}
                      {c.summary && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                      )}
                      {c.skills && c.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.skills.slice(0, 5).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {c.skills.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{c.skills.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {c.category && (
                        <Badge variant={categoryVariants[c.category] || 'secondary'} className="capitalize">
                          {c.category.replace('_', ' ')}
                        </Badge>
                      )}
                      {c.overall_score !== null && (
                        <span
                          className={cn(
                            'text-2xl font-bold tracking-tight',
                            c.overall_score >= 75
                              ? 'text-emerald-500'
                              : c.overall_score >= 50
                                ? 'gold-gradient-text'
                                : 'text-destructive',
                          )}
                        >
                          {c.overall_score.toFixed(0)}%
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </Stagger>
        </div>
      )}

      {compareModal && compareModal.length > 0 && (
        <Dialog open onOpenChange={() => setCompareModal(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Compare Candidates</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="w-40 pr-4 py-2 text-left font-medium text-muted-foreground">Field</th>
                    {compareModal.map((c) => (
                      <th key={c.id} className="min-w-[200px] py-2 px-3 text-left font-semibold">
                        {c.name || 'Unnamed'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['Score', (c: CandidateProfile) => c.overall_score !== null ? `${c.overall_score.toFixed(0)}%` : '-'],
                    ['Category', (c: CandidateProfile) => c.category?.replace('_', ' ') || '-'],
                    ['Status', (c: CandidateProfile) => c.status || '-'],
                    ['Email', (c: CandidateProfile) => c.email || '-'],
                    ['Location', (c: CandidateProfile) => c.location || '-'],
                    ['Summary', (c: CandidateProfile) => c.summary ? c.summary.substring(0, 150) + '...' : '-'],
                    ['Skills', (c: CandidateProfile) => c.skills?.join(', ') || '-'],
                  ] as const).map(([label, fn]) => (
                    <tr key={label} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium align-top text-muted-foreground">{label}</td>
                      {compareModal.map((c) => (
                        <td key={c.id} className="py-2 px-3 align-top">
                          {(fn as (c: CandidateProfile) => string)(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Reveal>
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-lg shadow-gold/25">
          <Search className="h-7 w-7 text-gold-foreground" />
        </div>
        <p className="text-lg font-semibold text-muted-foreground">No candidates found</p>
        <p className="mt-1 text-sm text-muted-foreground/60">Upload or extract resumes to get started</p>
        <Link href="/bulk" className="mt-5 inline-flex">
          <Button variant="gold">
            Upload resumes
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Reveal>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-4"><PageLoader /></div>}>
      <CandidatesContent />
    </Suspense>
  );
}
