'use client';

import { useState, useEffect } from 'react';
import { api, DashboardMetrics } from '@/lib/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading dashboard...</div>;

  const cats = metrics?.category_distribution || {};
  const total = metrics?.total_resumes || 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Resumes" value={metrics?.total_resumes ?? 0} color="blue" />
        <MetricCard label="Processed" value={metrics?.processed_resumes ?? 0} color="green" />
        <MetricCard label="Strong Matches" value={metrics?.strong_matches ?? 0} color="indigo" />
        <MetricCard label="Duplicates" value={metrics?.duplicate_candidates ?? 0} color="red" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Category Distribution</h2>
        {total === 0 ? (
          <p className="text-gray-500">No candidates yet. Upload resumes to see distribution.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(cats).map(([key, count]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700">{key.replace('_', ' ')}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction href="/candidates" label="View Candidates" desc="Browse and manage all candidates" />
          <QuickAction href="/analyze" label="Analyze Resume" desc="Match a resume against a job description" />
          <QuickAction href="/bulk" label="Bulk Upload" desc="Process hundreds of resumes at once" />
          <QuickAction href="/batches" label="Batch History" desc="View, re-analyze, or delete previous uploads" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow transition-all"
    >
      <h3 className="font-semibold text-gray-800">{label}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </a>
  );
}
