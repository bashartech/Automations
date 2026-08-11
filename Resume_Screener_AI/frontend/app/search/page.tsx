'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Sparkles, UserRound } from 'lucide-react';
import { api, SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

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
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="AI Tooling"
          title="Semantic Search"
          description="Find the right candidates by meaning — not just keywords."
        />
      </Reveal>

      <Reveal y={18}>
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. React developer with 3 years experience"
                className="pl-9"
              />
            </div>
            <Button variant="gold" onClick={handleSearch} disabled={loading || !query.trim()} className="gap-1.5">
              <SearchIcon className="h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </Reveal>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-gold" /> Searching candidates...
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Reveal>
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-lg shadow-gold/20">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">No candidates found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search query</p>
          </div>
        </Reveal>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{results.length} result{results.length > 1 ? 's' : ''}</p>
          <Stagger className="space-y-3" staggerChildren={0.05}>
            {results.map((r) => {
              const relevance = Math.round((r.relevance_score || 0) * 100);
              return (
                <motion.div key={r.id} variants={staggerItem}>
                  <Link href={`/candidates/${r.id}`} className="group block">
                    <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1.5">
                          <h3 className="flex items-center gap-2 font-semibold group-hover:text-gold transition-colors">
                            <UserRound className="h-4 w-4 text-gold" />
                            {r.name || 'Unnamed Candidate'}
                          </h3>
                          {r.email && <p className="text-sm text-muted-foreground">{r.email}</p>}
                          {r.summary && <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>}
                          {r.skills && r.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {r.skills.slice(0, 4).map((s, i) => (
                                <Badge key={i} variant="info" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Relevance</p>
                          <div className="flex items-center gap-1.5">
                            <p className={cn(
                              'text-lg font-bold',
                              relevance >= 70 ? 'text-emerald-500' : relevance >= 40 ? 'gold-gradient-text' : 'text-muted-foreground',
                            )}>
                              {relevance}%
                            </p>
                          </div>
                          {r.overall_score !== null && (
                            <p className="mt-1 text-xs text-muted-foreground">Score: {r.overall_score.toFixed(0)}%</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </Stagger>
        </div>
      )}
    </div>
  );
}
