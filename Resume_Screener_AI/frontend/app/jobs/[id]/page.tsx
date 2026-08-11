'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, DollarSign, GraduationCap, Briefcase, FileText, Sparkles, Save } from 'lucide-react';
import { api, authApi, JobResponse, CandidateProfile, AnalyzeResponse, isAuthenticated, getCompanyId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: string; badge: 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  draft: { label: 'Draft', badge: 'secondary' },
  pending_review: { label: 'Pending Review', badge: 'warning' },
  approved: { label: 'Approved', badge: 'success' },
  closed: { label: 'Closed', badge: 'destructive' },
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [companyId, setCompId] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [candidates, setCandidates] = useState<(CandidateProfile & { analysis?: AnalyzeResponse })[]>([]);
  const [loading, setLoading] = useState(true);
  const [jdText, setJdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    authApi.me().then(u => {
      const cid = u.company_id || getCompanyId();
      if (cid) setCompId(cid);
    }).catch(() => {});
  }, []);

  async function load() {
    try {
      const j = await api.getJob(companyId!, id as string);
      setJob(j);
      setJdText(j.description || '');
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => {
    if (companyId && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, id]);

  async function analyzeAll() {
    setAnalyzing(true);
    try {
      const all = await api.getCandidates();
      const results: (CandidateProfile & { analysis?: AnalyzeResponse })[] = [];
      for (const c of all) {
        try {
          const analysis = await api.analyzeCandidate(c.id, jdText);
          results.push({ ...c, analysis });
        } catch { results.push(c); }
      }
      setCandidates(results);
    } catch { alert('Analysis failed'); }
    finally { setAnalyzing(false); }
  }

  if (loading) return <PageLoader />;
  if (!job) return (
    <div className="glass-card rounded-3xl p-6">
      <p className="font-semibold text-muted-foreground">Job not found</p>
    </div>
  );

  const st = STATUS_STYLES[job.status] || STATUS_STYLES.draft;

  const stats = [
    { icon: MapPin, label: 'Location', value: job.location || 'N/A' },
    { icon: Briefcase, label: 'Type', value: `${job.employment_type} · ${job.remote_type}` },
    { icon: GraduationCap, label: 'Experience', value: job.experience_required },
    { icon: DollarSign, label: 'Salary', value: job.salary_min && job.salary_max ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}` : 'N/A' },
    { icon: Users, label: 'Openings', value: String(job.num_openings) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <Button variant="ghost" size="sm" onClick={() => router.push('/jobs')} className="-ml-2 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Button>
      </Reveal>

      <Reveal y={18}>
        <div className="glass-card relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">{job.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {job.location || 'Remote'} · {job.employment_type?.replace('-', ' ')} · {job.remote_type}
              </p>
            </div>
            <Badge variant={st.badge} className="capitalize">{st.label}</Badge>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </div>
                <p className="mt-1 truncate text-sm font-semibold capitalize">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Stagger className="space-y-5" staggerChildren={0.06}>
        {job.required_skills && job.required_skills.length > 0 && (
          <motion.section variants={staggerItem} className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-gold" /> Required Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map(s => <Badge key={s} variant="info">{s}</Badge>)}
            </div>
          </motion.section>
        )}

        <motion.section variants={staggerItem} className="glass-card rounded-2xl p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-gold" /> Job Description
          </h2>
          <Textarea rows={8} value={jdText} onChange={e => setJdText(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="gold" onClick={analyzeAll} disabled={analyzing || !jdText.trim()} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              {analyzing ? 'Analyzing candidates…' : 'Analyze All Candidates Against This JD'}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={saved}
              onClick={async () => {
                try { await api.updateJob(companyId!, id as string, { description: jdText }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
                catch(e: any) { alert(e.message); }
              }}
            >
              <Save className="h-4 w-4" /> {saved ? 'Saved' : 'Save Description'}
            </Button>
          </div>
        </motion.section>

        {candidates.length > 0 && (
          <motion.section variants={staggerItem}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
              <Briefcase className="h-5 w-5 text-gold" /> Scores for {job.title}
            </h2>
            <div className="space-y-3">
              {candidates.sort((a, b) => ((b.analysis?.scores?.overall_score || 0) - (a.analysis?.scores?.overall_score || 0))).map(c => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className="group glass-card flex cursor-pointer flex-col gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-semibold group-hover:text-gold transition-colors">{c.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    {c.skills && (
                      <div className="flex flex-wrap gap-1">{(c.skills || []).slice(0, 4).map(s => <Badge key={s} variant="info">{s}</Badge>)}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {c.analysis ? (
                      <>
                        <p className={cn(
                          'text-2xl font-bold',
                          (c.analysis.scores?.overall_score || 0) >= 70 ? 'text-emerald-500' : (c.analysis.scores?.overall_score || 0) >= 40 ? 'text-amber-500' : 'text-destructive',
                        )}>
                          {c.analysis.scores?.overall_score || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.analysis.recommendation}</p>
                      </>
                    ) : <p className="text-muted-foreground">Not scored</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </Stagger>
    </div>
  );
}
