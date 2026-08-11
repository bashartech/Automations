'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Trophy,
  Copy,
  Briefcase,
  Users,
  CalendarDays,
  XCircle,
  Target,
  Timer,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api, DashboardMetrics, isAuthenticated } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/metric-card';
import { PageLoader } from '@/components/premium-loader';
import { MetricSkeletonGrid } from '@/components/skeletons';
import { Reveal, Stagger, staggerItem, AnimatedNumber } from '@/components/motion/reveal';
import {
  LandingHero,
  LandingStats,
  LandingFeatures,
  LandingWorkflow,
  LandingShowcase,
  LandingCTA,
  LandingFooter,
} from '@/components/landing';

export default function Dashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthed(auth);
    if (!auth) {
      setLoading(false);
      return;
    }
    api.getDashboardMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (authed === false) {
    return (
      <div className="min-h-screen">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <div id="workflow" />
        <LandingWorkflow />
        <LandingShowcase />
        <LandingCTA />
        <LandingFooter />
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const cats = metrics?.category_distribution || {};
  const total = Object.values(cats).reduce((a, b) => a + b, 0);
  const funnel = metrics?.funnel || {};

  function fmt(v: string | number | undefined | null): string {
    if (v === undefined || v === null) return '0';
    if (typeof v === 'number') return v.toLocaleString();
    return String(v);
  }

  return (
    <div className="space-y-8">
      <Reveal y={16}>
        <div className="relative overflow-hidden rounded-3xl glass-card px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="animate-aurora absolute -right-24 -top-32 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -left-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <Sparkles className="h-3.5 w-3.5" /> Hiring Overview
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Welcome back, <span className="gold-gradient-text italic">recruiter</span>
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground md:text-base">
                Here&apos;s how your talent pipeline is performing today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/bulk"
                className="gold-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-lg shadow-gold/25 transition-all hover:brightness-110"
              >
                Upload resumes
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/candidates"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:border-gold/50 hover:bg-gold-soft/40"
              >
                View candidates
              </a>
            </div>
          </div>
        </div>
      </Reveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.06}>
        <MetricCard label="Total Resumes" value={fmt(metrics?.total_resumes)} icon={<FileText className="h-4 w-4 text-gold" />} accent="gold" />
        <MetricCard label="Processed" value={fmt(metrics?.processed_resumes)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <MetricCard label="Strong Matches" value={fmt(metrics?.strong_matches)} icon={<Trophy className="h-4 w-4 text-gold" />} accent="gold" />
        <MetricCard label="Duplicates" value={fmt(metrics?.duplicate_candidates)} icon={<Copy className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Total Jobs" value={fmt(metrics?.total_jobs)} icon={<Briefcase className="h-4 w-4 text-blue-500" />} />
        <MetricCard label="Total Candidates" value={fmt(metrics?.total_candidates)} icon={<Users className="h-4 w-4 text-gold" />} accent="gold" />
        <MetricCard label="Total Interviews" value={fmt(metrics?.total_interviews)} icon={<CalendarDays className="h-4 w-4 text-emerald-500" />} />
        <MetricCard label="Rejected" value={fmt(metrics?.total_rejected)} icon={<XCircle className="h-4 w-4 text-destructive" />} accent="danger" />
        <MetricCard label="Avg Score" value={fmt(metrics?.average_match_score)} icon={<Target className="h-4 w-4 text-gold" />} accent="gold" />
        <MetricCard label="Avg Processing (s)" value={fmt(metrics?.avg_processing_time_seconds)} icon={<Timer className="h-4 w-4 text-muted-foreground" />} />
      </Stagger>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Category Distribution</h2>
              <Badge variant="gold">{total} total</Badge>
            </div>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">
                No candidates yet. Upload resumes to see distribution.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(cats).map(([key, count], i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                        className="h-full rounded-full gold-gradient"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Candidate Funnel</h2>
              <Badge variant="gold">Pipeline</Badge>
            </div>
            {Object.keys(funnel).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(funnel).map(([key, count], i) => {
                  const maxVal = Math.max(...Object.values(funnel), 1);
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                    >
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(count / maxVal) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                          className="h-full rounded-full bg-emerald-500"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {metrics?.top_skills && metrics.top_skills.length > 0 && (
        <Reveal delay={0.05}>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Top Skills</h2>
              <Badge variant="gold">Trending</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.top_skills.map((skill) => (
                <Badge key={skill} variant="info">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
          <Badge variant="gold">Navigate</Badge>
        </div>
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.05}>
          <QuickAction href="/candidates" label="View Candidates" desc="Browse and manage all candidates" />
          <QuickAction href="/jobs" label="Manage Jobs" desc="Create and manage job postings" />
          <QuickAction href="/interviews" label="Interviews" desc="Schedule and manage interviews" />
          <QuickAction href="/analyze" label="Analyze Resume" desc="Match a resume against a job description" />
          <QuickAction href="/bulk" label="Bulk Upload" desc="Process hundreds of resumes at once" />
          <QuickAction href="/batches" label="Batch History" desc="View, re-analyze, or delete previous uploads" />
          <QuickAction href="/analytics" label="Analytics" desc="View metrics, logs, and notifications" />
          <QuickAction href="/settings" label="Settings" desc="Company profile, weights, knowledge base" />
        </Stagger>
      </div>
    </div>
  );
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <motion.a
      variants={staggerItem}
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-border/70 bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gold/10 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <h3 className="flex items-center gap-1.5 font-semibold">
        {label}
        <ArrowRight className="h-3.5 w-3.5 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </motion.a>
  );
}
