'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ProcessingJobResponse } from '@/lib/api';

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
      // poll for completion
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

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Batch History</h1>
        <Link
          href="/bulk"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + New Upload
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No batches yet</p>
          <p className="text-gray-400 mt-1">Upload resumes via the Bulk Upload page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div key={b.id} className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py.5 rounded-full capitalize ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {b.job_description && (
                  <p className="text-sm text-gray-700 mt-1 truncate max-w-xl">
                    <span className="font-medium">JD:</span> {b.job_description.substring(0, 120)}{b.job_description.length > 120 ? '...' : ''}
                  </p>
                )}
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  <span>{b.total_files} total</span>
                  <span className="text-green-600">{b.processed_files} done</span>
                  {b.failed_files > 0 && <span className="text-red-600">{b.failed_files} failed</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Link
                  href={`/candidates?batch_id=${b.id}`}
                  className="text-blue-600 text-sm hover:underline px-2"
                >
                  View
                </Link>

                {/* Re-analyze */}
                {reanalyzeId === b.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={reanalyzeJd}
                      onChange={(e) => setReanalyzeJd(e.target.value)}
                      placeholder="New job description..."
                      className="w-48 px-2 text-black py-1 text-xs border border-gray-300 rounded"
                      disabled={reanalyzing === b.id}
                    />
                    <button
                      onClick={() => handleReanalyze(b.id)}
                      disabled={!reanalyzeJd.trim() || reanalyzing === b.id}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                    >
                      {reanalyzing === b.id ? (
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : 'Go'}
                    </button>
                    <button
                      onClick={() => { setReanalyzeId(null); setReanalyzeJd(''); }}
                      disabled={reanalyzing === b.id}
                      className="text-xs text-gray-500 px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReanalyzeId(b.id)}
                    disabled={reanalyzing === b.id}
                    className="text-blue-600 text-sm hover:underline px-2 disabled:opacity-50"
                  >
                    {reanalyzing === b.id ? '...' : 'Re-analyze'}
                  </button>
                )}

                {b.failed_files > 0 && (
                  <button
                    onClick={() => handleRetry(b.id)}
                    disabled={retrying === b.id}
                    className="text-orange-600 text-sm hover:underline px-2 disabled:opacity-50"
                  >
                    {retrying === b.id ? '...' : 'Retry'}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deleting === b.id}
                  className="text-red-600 text-sm hover:underline px-2 disabled:opacity-50"
                >
                  {deleting === b.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
