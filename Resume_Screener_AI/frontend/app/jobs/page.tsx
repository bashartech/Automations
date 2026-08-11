'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Trash2, Send, CheckCircle2, Sparkles, X } from 'lucide-react';
import { api, authApi, JobResponse, JobCreate, JDReviewResponse, isAuthenticated, getCompanyId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: string; badge: 'secondary' | 'warning' | 'success' | 'destructive'; dot: string }> = {
  draft: { label: 'Draft', badge: 'secondary', dot: 'bg-slate-400' },
  pending_review: { label: 'Pending Review', badge: 'warning', dot: 'bg-amber-400' },
  approved: { label: 'Approved', badge: 'success', dot: 'bg-emerald-400' },
  closed: { label: 'Closed', badge: 'destructive', dot: 'bg-destructive' },
};

export default function JobsPage() {
  const router = useRouter();
  const [companyId, setCompId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<JobCreate & { description: string }>({
    title: '', description: '', employment_type: 'full-time',
    location: '', remote_type: 'remote', experience_required: 'mid',
    salary_min: 0, salary_max: 0, num_openings: 1,
    required_skills: [], preferred_skills: [], responsibilities: [],
    qualifications: [], benefits: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [review, setReview] = useState<JDReviewResponse | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    authApi.me().then(u => {
      const cid = u.company_id || getCompanyId();
      if (cid) setCompId(cid);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (companyId) loadJobs();
  }, [companyId]);

  async function loadJobs() {
    try { setJobs(await api.getJobs(companyId!)); } catch {}
    finally { setLoading(false); }
  }

  function addSkill(skill: string, list: 'required_skills' | 'preferred_skills') {
    if (!skill.trim()) return;
    setForm({...form, [list]: [...(form[list] || []), skill.trim()]});
    setSkillInput('');
  }

  function removeSkill(skill: string, list: 'required_skills' | 'preferred_skills') {
    setForm({...form, [list]: (form[list] || []).filter(s => s !== skill)});
  }

  async function handleReview() {
    if (!form.description.trim()) return;
    setReviewing(true);
    try {
      const jdReview = await api.reviewJobDescriptionDraft(companyId!, {
        title: form.title,
        description: form.description,
        required_skills: form.required_skills,
      });
      setReview(jdReview);
    }
    catch (e: any) { alert(e.message); }
    finally { setReviewing(false); }
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.createJob(companyId!, form);
      setShowForm(false);
      setForm({ title: '', description: '', employment_type: 'full-time', location: '', remote_type: 'remote', experience_required: 'mid', salary_min: 0, salary_max: 0, num_openings: 1, required_skills: [], preferred_skills: [], responsibilities: [], qualifications: [], benefits: [] });
      setReview(null);
      loadJobs();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleStatus(jobId: string, status: string) {
    try { await api.updateJob(companyId!, jobId, { status } as Partial<JobCreate> & { status: string }); loadJobs(); }
    catch (e: any) { alert(e.message); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Recruitment"
          title="Jobs"
          description="Create, review, and manage job postings across your hiring pipeline."
          actions={
            <Button variant="gold" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'New Job'}
            </Button>
          }
        />
      </Reveal>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="job-form"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-card overflow-hidden rounded-3xl">
              <div className="border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-lg font-semibold tracking-tight">Create Job Posting</h2>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Job Title *</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Employment Type</Label>
                    <Select value={form.employment_type} onValueChange={v => setForm({...form, employment_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Remote / City" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remote Type</Label>
                    <Select value={form.remote_type} onValueChange={v => setForm({...form, remote_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Experience</Label>
                    <Select value={form.experience_required} onValueChange={v => setForm({...form, experience_required: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry</SelectItem>
                        <SelectItem value="mid">Mid</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Openings</Label>
                    <Input type="number" min={1} value={form.num_openings} onChange={e => setForm({...form, num_openings: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salary Min</Label>
                    <Input type="number" value={form.salary_min} onChange={e => setForm({...form, salary_min: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salary Max</Label>
                    <Input type="number" value={form.salary_max} onChange={e => setForm({...form, salary_max: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Required Skills</Label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {(form.required_skills || []).map(s => (
                      <Badge key={s} variant="info" className="gap-1 pr-1">
                        {s}
                        <button className="ml-1 cursor-pointer text-xs opacity-70 transition-opacity hover:opacity-100" onClick={() => removeSkill(s, 'required_skills')}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      placeholder="Add skill and press Enter"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput, 'required_skills'); } }}
                    />
                    <Button variant="outline" onClick={() => addSkill(skillInput, 'required_skills')}>Add</Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Job Description *</Label>
                  <Textarea rows={6} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Paste job description..." />
                  <Button variant="outline" size="sm" onClick={handleReview} disabled={reviewing || !form.description.trim()} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                    {reviewing ? 'Reviewing...' : 'Review with AI'}
                  </Button>
                </div>

                {review && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3 rounded-2xl border border-gold/25 bg-gold-soft/10 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <span className="font-semibold">Quality Score:</span>
                      <span className={cn('font-bold', review.overall_quality_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {review.overall_quality_score}/100
                      </span>
                    </div>
                    {review.suggestions.length > 0 && (
                      <div>
                        <span className="font-semibold">Suggestions:</span>
                        <ul className="list-inside list-disc text-sm text-muted-foreground">{review.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                    {review.missing_skills.length > 0 && (
                      <div>
                        <span className="font-semibold">Missing Skills:</span>
                        <div className="mt-1 flex flex-wrap gap-1">{review.missing_skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                      </div>
                    )}
                    {review.grammar_issues.length > 0 && (
                      <div>
                        <span className="font-semibold">Grammar Issues:</span>
                        <ul className="list-inside list-disc text-sm text-muted-foreground">{review.grammar_issues.map((g, i) => <li key={i}>{g}</li>)}</ul>
                      </div>
                    )}
                    {review.inclusive_language_suggestions.length > 0 && (
                      <div>
                        <span className="font-semibold">Inclusive Language:</span>
                        <ul className="list-inside list-disc text-sm text-muted-foreground">{review.inclusive_language_suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                    {review.improved_description && (
                      <div className="mt-2 border-t border-border/60 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold">AI Improved Description</span>
                          <Button size="sm" variant="gold" onClick={() => setForm({...form, description: review.improved_description})}>Use AI description</Button>
                        </div>
                        <p className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md border bg-background/60 p-3 text-sm">{review.improved_description}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="gold" onClick={handleCreate} disabled={saving || !form.title.trim() || !form.description.trim()}>
                    {saving ? 'Creating...' : 'Create Job'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <Reveal>
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-lg shadow-gold/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">No jobs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first job posting to get started.</p>
            <Button variant="gold" className="mt-5 gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> New Job
            </Button>
          </div>
        </Reveal>
      ) : (
        <Stagger className="space-y-4" staggerChildren={0.06}>
          {jobs.map(job => {
            const st = STATUS_STYLES[job.status] || STATUS_STYLES.draft;
            return (
              <motion.div
                key={job.id}
                variants={staggerItem}
                className="group glass-card cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-lg font-semibold tracking-tight group-hover:text-gold transition-colors">
                        {job.title}
                      </h3>
                      <Badge variant={st.badge} className="gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {job.location || 'Remote'} · {job.employment_type?.replace('-', ' ')} · {job.experience_required}
                    </p>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {job.required_skills.slice(0, 5).map(s => <Badge key={s} variant="info">{s}</Badge>)}
                        {job.required_skills.length > 5 && <span className="text-xs text-muted-foreground">+{job.required_skills.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    {job.status === 'draft' && (
                      <Button size="sm" onClick={() => handleStatus(job.id, 'pending_review')} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Submit
                      </Button>
                    )}
                    {job.status === 'pending_review' && (
                      <Button size="sm" onClick={() => handleStatus(job.id, 'approved')} className="gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {job.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(job.id, 'closed')}>Close</Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => api.deleteJob(companyId!, job.id).then(loadJobs)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
