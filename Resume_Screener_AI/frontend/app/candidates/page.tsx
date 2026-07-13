'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, CandidateProfile, ProcessingJobResponse } from '@/lib/api';

function CandidatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get('resume_id') || undefined;
  const batchIdParam = searchParams.get('batch_id') || undefined;
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [batches, setBatches] = useState<ProcessingJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(batchIdParam || '');
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [compareModal, setCompareModal] = useState<CandidateProfile[] | null>(null);

  function load() {
    setLoading(true);
    api.getCandidates(filter || undefined, resumeId, selectedBatch || undefined, minScore > 0 ? minScore : undefined, statusFilter || undefined)
      .then(setCandidates).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    api.getBatches().then(setBatches).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filter, resumeId, selectedBatch, minScore, statusFilter]);

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
    } else if (bulkAction === 'export') {
      const ids = Array.from(selectedIds);
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('ids', id));
      window.open(api.getExportCsvUrl({ batchId: selectedBatch || undefined }), '_blank');
      return;
    } else if (bulkAction.startsWith('status:')) {
      const s = bulkAction.replace('status:', '');
      await api.bulkUpdateStatus(Array.from(selectedIds), s);
    } else if (bulkAction === 'compare') {
      const ids = Array.from(selectedIds);
      if (ids.length < 2) { alert('Select at least 2 candidates to compare'); return; }
      const profiles = await api.compareCandidates(ids);
      setCompareModal(profiles);
      return;
    }
    setSelectedIds(new Set());
    load();
  };

  const categoryColors: Record<string, string> = {
    strong_match: 'bg-green-100 text-green-800',
    good_match: 'bg-blue-100 text-blue-800',
    average_match: 'bg-yellow-100 text-yellow-800',
    weak_match: 'bg-orange-100 text-orange-800',
    reject: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    shortlisted: 'bg-indigo-100 text-indigo-700',
    interviewed: 'bg-blue-100 text-blue-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const bulkActions = [
    { value: '', label: 'Bulk actions...' },
    { value: 'delete', label: 'Delete selected' },
    { value: 'export', label: 'Export selected' },
    { value: 'compare', label: 'Compare selected' },
    { value: 'status:shortlisted', label: 'Mark shortlisted' },
    { value: 'status:interviewed', label: 'Mark interviewed' },
    { value: 'status:hired', label: 'Mark hired' },
    { value: 'status:rejected', label: 'Mark rejected' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <span className="text-sm text-gray-500 self-center">{selectedIds.size} selected</span>
          )}
          <a
            href={api.getExportCsvUrl({ batchId: selectedBatch || undefined, category: filter || undefined, minScore: minScore || undefined, status: statusFilter || undefined })}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        {['', 'strong_match', 'good_match', 'average_match', 'weak_match', 'reject'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat ? cat.replace('_', ' ') : 'All'}
          </button>
        ))}

        {/* Score slider */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-gray-500">Min score:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-20 h-1.5"
          />
          <span className="text-xs font-medium text-gray-700 w-6">{minScore}%</span>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-xs border border-gray-300 bg-white text-gray-700"
        >
          <option value="">All status</option>
          <option value="new">New</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interviewed">Interviewed</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Batch selector */}
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white text-gray-700"
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {new Date(b.created_at).toLocaleDateString()} — {b.total_files} files
            </option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white"
          >
            {bulkActions.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No candidates found</p>
          <p className="text-gray-400 mt-1">Upload or extract resumes to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={selectedIds.size === candidates.length && candidates.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-400">Select all ({candidates.length})</span>
          </div>

          {candidates.map((c) => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                className={`bg-white rounded-lg shadow p-5 flex items-start gap-3 transition-shadow ${
                  isSelected ? 'ring-2 ring-blue-400' : 'hover:shadow-md'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(c.id)}
                  className="w-4 h-4 mt-1 shrink-0"
                />
                <Link href={`/candidates/${c.id}`} className="flex-1 min-w-0 block">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {c.name || 'Unnamed Candidate'}
                        </h3>
                        {c.status && (
                          <span className={`text-[10px] font-medium px-2 py.5 rounded-full ${
                            statusColors[c.status] || 'bg-gray-100 text-gray-600'
                          }`}>
                            {c.status}
                          </span>
                        )}
                      </div>
                      {c.email && <p className="text-sm text-gray-500">{c.email}</p>}
                      {c.summary && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.summary}</p>
                      )}
                      {c.skills && c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.skills.slice(0, 5).map((s, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                          {c.skills.length > 5 && (
                            <span className="text-xs text-gray-400">+{c.skills.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                      {c.category && (
                        <span className={`text-xs font-medium px-2.5 py.5 rounded-full capitalize ${
                          categoryColors[c.category] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.category.replace('_', ' ')}
                        </span>
                      )}
                      {c.overall_score !== null && (
                        <span className="text-2xl font-bold text-gray-800">
                          {c.overall_score.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Compare modal */}
      {compareModal && compareModal.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-auto pt-12 pb-12">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 overflow-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">Compare Candidates</h2>
              <button onClick={() => setCompareModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-gray-500 w-40">Field</th>
                    {compareModal.map((c) => (
                      <th key={c.id} className="text-left py-2 px-3 font-semibold text-gray-900 min-w-[200px]">
                        {c.name || 'Unnamed'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['Score', (c: CandidateProfile) => c.overall_score !== null ? `${c.overall_score.toFixed(0)}%` : '-'],
                    ['Category', (c: CandidateProfile) => c.category?.replace('_', ' ') || '-'],
                    ['Status', (c: CandidateProfile) => c.status || '-'],
                    ['Email', (c: CandidateProfile) => c.email || '-'],
                    ['Location', (c: CandidateProfile) => c.location || '-'],
                    ['Summary', (c: CandidateProfile) => c.summary ? c.summary.substring(0, 150) + '...' : '-'],
                    ['Skills', (c: CandidateProfile) => c.skills?.join(', ') || '-'],
                  ].map(([label, fn]) => (
                    <tr key={label as string} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-gray-500 align-top">{label as string}</td>
                      {compareModal.map((c) => (
                        <td key={c.id} className="py-2 px-3 text-gray-700 align-top">{(fn as Function)(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading candidates...</div>}>
      <CandidatesContent />
    </Suspense>
  );
}
