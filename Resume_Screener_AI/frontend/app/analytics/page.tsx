'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Activity, Bell, TrendingUp, Gauge, Timer, Trophy, Layers, ScrollText } from 'lucide-react';
import { api, DashboardMetrics, NotificationResponse, ActivityLogResponse, isAuthenticated } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem, AnimatedNumber } from '@/components/motion/reveal';
import { MetricCard } from '@/components/metric-card';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'logs' | 'notifications'>('overview');

  async function load() {
    try {
      const [m, n, l] = await Promise.all([
        api.getDashboardMetrics(),
        api.getNotifications().catch(() => []),
        api.getActivityLogs().catch(() => []),
      ]);
      setMetrics(m); setNotifications(n); setLogs(l);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <PageLoader />;

  const cats = metrics?.category_distribution || {};
  const totalCat = Object.values(cats).reduce((a, b) => a + b, 0);
  const funnel = metrics?.funnel || {};

  const metricItems = [
    { label: 'Total Resumes', value: metrics?.total_resumes || 0 },
    { label: 'Processed', value: metrics?.processed_resumes || 0 },
    { label: 'Strong Matches', value: metrics?.strong_matches || 0 },
    { label: 'Duplicates Found', value: metrics?.duplicate_candidates || 0 },
    { label: 'Total Jobs', value: metrics?.total_jobs || 0 },
    { label: 'Candidates', value: metrics?.total_candidates || 0 },
    { label: 'Interviews', value: metrics?.total_interviews || 0 },
    { label: 'Rejected', value: metrics?.total_rejected || 0 },
  ];

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'logs' as const, label: 'Activity Logs', icon: ScrollText },
    { key: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="Understand your candidate pipeline, funnel health, and screening performance."
          actions={
            <div className="flex gap-1.5 rounded-full border border-border/60 bg-background/40 p-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                    tab === t.key ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>
          }
        />
      </Reveal>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metricItems.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.04} y={14}>
                <MetricCard label={m.label} value={m.value} />
              </Reveal>
            ))}
          </div>

          <Stagger className="grid grid-cols-1 gap-5 lg:grid-cols-2" staggerChildren={0.06}>
            <motion.section variants={staggerItem} className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <Layers className="h-4 w-4 text-gold" /> Category Distribution
              </h2>
              {totalCat === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {Object.entries(cats).map(([key, count]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${totalCat > 0 ? (count / totalCat) * 100 : 0}%` }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full gold-gradient"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section variants={staggerItem} className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <TrendingUp className="h-4 w-4 text-gold" /> Candidate Funnel
              </h2>
              {Object.keys(funnel).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {Object.entries(funnel).map(([key, count]) => {
                    const maxVal = Math.max(...Object.values(funnel), 1);
                    return (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{key}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxVal) * 100}%` }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>

            <motion.section variants={staggerItem} className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <Trophy className="h-4 w-4 text-gold" /> Top Skills
              </h2>
              {!metrics?.top_skills?.length ? (
                <p className="text-sm text-muted-foreground">No skills data.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {metrics.top_skills.map(s => <Badge key={s} variant="info">{s}</Badge>)}
                </div>
              )}
            </motion.section>

            <motion.section variants={staggerItem} className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <Gauge className="h-4 w-4 text-gold" /> Performance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" /> Average Match Score
                  </span>
                  <span className="font-semibold">{(metrics?.average_match_score || 0).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" /> Avg Processing Time
                  </span>
                  <span className="font-semibold">{(metrics?.avg_processing_time_seconds || 0).toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" /> Selected
                  </span>
                  <span className="font-semibold"><AnimatedNumber value={metrics?.total_selected || 0} /></span>
                </div>
              </div>
            </motion.section>
          </Stagger>
        </>
      )}

      {tab === 'logs' && (
        <Reveal>
          <div className="glass-card rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <Activity className="h-4 w-4 text-gold" /> Activity Log
            </h2>
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <div className="max-h-[600px] space-y-1 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl p-2.5 text-sm transition-colors duration-200 hover:bg-background/40">
                    <Badge variant="outline" className="shrink-0">{log.action}</Badge>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {log.entity_type}
                        {log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}
                      </p>
                      {log.details && <p className="truncate text-xs text-muted-foreground">{JSON.stringify(log.details).slice(0, 200)}</p>}
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {tab === 'notifications' && (
        <Reveal>
          <div className="glass-card rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <Bell className="h-4 w-4 text-gold" /> Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-200',
                    !n.read ? 'border-gold/30 bg-gold-soft/10' : 'border-border/60 bg-background/30',
                  )}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      {n.link && <a href={n.link} className="text-xs font-medium text-gold hover:underline">View</a>}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn('text-xs', n.read ? 'text-muted-foreground' : 'font-semibold text-gold')}>
                        {n.read ? 'Read' : 'New'}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
