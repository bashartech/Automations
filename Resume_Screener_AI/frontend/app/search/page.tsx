'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, SearchResult } from '@/lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.searchCandidates(query);
      setResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Semantic Search</h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. React developer with 3 years experience"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p className="text-gray-500">Searching candidates...</p>}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No candidates found</p>
          <p className="text-gray-400 mt-1">Try a different search query</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{results.length} result{results.length > 1 ? 's' : ''}</p>
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/candidates/${r.id}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.name || 'Unnamed Candidate'}</h3>
                  {r.email && <p className="text-sm text-gray-500">{r.email}</p>}
                  {r.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>}
                  {r.skills && r.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.skills.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Relevance</p>
                  <p className="text-lg font-bold text-blue-600">{(r.relevance_score * 100).toFixed(0)}%</p>
                  {r.overall_score !== null && (
                    <p className="text-xs text-gray-400 mt-1">Score: {r.overall_score.toFixed(0)}%</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
