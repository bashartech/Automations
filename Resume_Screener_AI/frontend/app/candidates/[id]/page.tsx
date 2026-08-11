'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  FileText,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { api, CandidateProfile, AnalyzeResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['new', 'shortlisted', 'interviewed', 'hired', 'rejected'];

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getCandidate(id).then((p) => {
      setProfile(p);
      setNotes(p.notes || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAnalyze = async () => {
    if (!jobDesc.trim()) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeCandidate(id, jobDesc);
      setAnalysis(result);
      setProfile((prev) => prev ? { ...prev, overall_score: result.overall_score, category: result.category } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (status === profile?.status) return;
    try {
      const updated = await api.updateCandidate(id, { status });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const updated = await api.updateCandidate(id, { notes });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!profile) return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border-destructive/40 p-6">
        <p className="font-semibold text-destructive">Candidate not found</p>
      </div>
    </div>
  );

  const categoryVariants: Record<string, 'success' | 'info' | 'warning' | 'destructive'> = {
    strong_match: 'success',
    good_match: 'info',
    average_match: 'warning',
    weak_match: 'destructive',
    reject: 'destructive',
  };

  const scoreTone = profile.overall_score !== null
    ? profile.overall_score >= 75 ? 'text-emerald-500' : profile.overall_score >= 50 ? 'gold-gradient-text' : 'text-destructive'
    : 'text-foreground';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Reveal>

      <Reveal y={18}>
        <div className="glass-card relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  {profile.name || 'Unnamed Candidate'}
                </h1>
                <Select value={profile.status || 'new'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 w-36 rounded-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {profile.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
                )}
              </div>
              <div className="mt-3 flex gap-4">
                {profile.linkedin && (
                  <a href={profile.linkedin} className="flex items-center gap-1.5 text-sm font-medium text-gold hover:underline" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} className="flex items-center gap-1.5 text-sm font-medium text-gold hover:underline" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> GitHub
                  </a>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              {profile.category && (
                <Badge variant={categoryVariants[profile.category] || 'secondary'} className="capitalize">
                  {profile.category.replace('_', ' ')}
                </Badge>
              )}
              {profile.overall_score !== null && (
                <div className="flex items-baseline gap-1">
                  <span className={cn('text-4xl font-bold tracking-tight', scoreTone)}>
                    {profile.overall_score.toFixed(0)}%
                  </span>
                  <span className="text-sm text-muted-foreground">match</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      <Stagger className="space-y-5" staggerChildren={0.05}>
        {profile.summary && (
          <Section icon={<FileText className="h-4 w-4" />} title="Summary">
            <p className="text-pretty text-muted-foreground">{profile.summary}</p>
          </Section>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <Section icon={<Sparkles className="h-4 w-4" />} title={`Skills (${profile.skills.length})`}>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s, i) => (
                <Badge key={i} variant="info">{s}</Badge>
              ))}
            </div>
          </Section>
        )}

        {profile.experience && profile.experience.length > 0 && (
          <Section icon={<Briefcase className="h-4 w-4" />} title="Experience">
            <div className="space-y-5">
              {profile.experience.map((exp, i) => (
                <motion.div key={i} variants={staggerItem} className="relative border-l-2 border-gold/40 pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full gold-gradient" />
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">{exp.company} · {exp.duration}</p>
                  {exp.description && <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p>}
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {profile.education && profile.education.length > 0 && (
          <Section icon={<GraduationCap className="h-4 w-4" />} title="Education">
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <motion.div key={i} variants={staggerItem}>
                  <h3 className="font-semibold">{edu.degree}</h3>
                  <p className="text-sm text-muted-foreground">{edu.institution} · {edu.year}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        <Section icon={<StickyNote className="h-4 w-4" />} title="Notes">
          <Textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            placeholder="Add private notes about this candidate..."
            rows={3}
          />
          <Button
            onClick={handleSaveNotes}
            disabled={saving}
            variant={saved ? 'secondary' : 'outline'}
            className="mt-3"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Notes'}
          </Button>
        </Section>

        <Section
          icon={<Sparkles className="h-4 w-4" />}
          title="Analyze Against Job Description"
          desc="Score this candidate against any job description with AI."
        >
          <Textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste job description here..."
            rows={4}
          />
          <Button onClick={handleAnalyze} disabled={analyzing || !jobDesc.trim()} variant="gold" className="mt-3">
            {analyzing ? (
              <>
                <span className="animate-pulse">Analyzing…</span>
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </Section>

        {analysis && (
          <Section icon={<Sparkles className="h-4 w-4 text-gold" />} title="Analysis Results">
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <ScoreBox label="Overall" value={analysis.overall_score} accent />
              <ScoreBox label="Skills" value={analysis.scores.skills_score} />
              <ScoreBox label="Experience" value={analysis.scores.experience_score} />
              <ScoreBox label="Education" value={analysis.scores.education_score} />
              <ScoreBox label="Certs" value={analysis.scores.certification_score} />
              <ScoreBox label="Projects" value={analysis.scores.project_score} />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <h3 className="mb-2 font-medium text-emerald-600 dark:text-emerald-400">Strengths</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
                <h3 className="mb-2 font-medium text-destructive">Weaknesses</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            {analysis.missing_requirements.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-medium text-amber-600 dark:text-amber-400">Missing Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_requirements.map((r, i) => (
                    <Badge key={i} variant="warning">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className={cn(
              'rounded-xl p-4 text-sm font-medium',
              analysis.recommendation === 'Strongly Recommend' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' :
              analysis.recommendation === 'Recommend' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' :
              analysis.recommendation === 'Consider' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' :
              'bg-destructive/10 text-destructive',
            )}>
              {analysis.recommendation}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{analysis.summary}</p>
          </Section>
        )}
      </Stagger>
    </div>
  );
}

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <motion.section variants={staggerItem} className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function ScoreBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border p-3 text-center transition-all duration-300 hover:-translate-y-0.5',
      accent ? 'border-gold/40 bg-gold-soft/40' : 'border-border/70 bg-background/40',
    )}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-bold', accent ? 'gold-gradient-text' : 'text-foreground')}>
        {value.toFixed(0)}%
      </p>
    </div>
  );
}
