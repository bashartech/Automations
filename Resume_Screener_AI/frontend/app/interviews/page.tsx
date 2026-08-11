'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPlus, CalendarDays, Clock, User, X, Video, XCircle, Plus, Trash2, Search } from 'lucide-react';
import { api, InterviewResponse, InterviewCreate, InterviewSlot, isAuthenticated } from '@/lib/api';
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

interface CandidateOption {
  id: string;
  name: string | null;
  email: string | null;
  overall_score: number | null;
}

const STATUS_STYLES: Record<string, { label: string; badge: 'info' | 'success' | 'destructive' | 'warning'; dot: string }> = {
  scheduled: { label: 'Scheduled', badge: 'info', dot: 'bg-sky-400' },
  completed: { label: 'Completed', badge: 'success', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', badge: 'destructive', dot: 'bg-destructive' },
  rescheduled: { label: 'Rescheduled', badge: 'warning', dot: 'bg-amber-400' },
};

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'interviews' | 'slots'>('interviews');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InterviewCreate>({
    candidate_id: '', date: '', time: '10:00',
    timezone: 'UTC', interviewer: '', interview_round: 1, notes: '',
  });
  const [slotForm, setSlotForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    load();
    api.getInterviewCandidates().then(setCandidates).catch(() => setCandidates([]));
  }, []);

  async function load() {
    try { setInterviews(await api.getInterviews()); } catch {}
    try { setSlots(await api.getInterviewSlots()); } catch {}
    setLoading(false);
  }

  const filteredCandidates = candidates.filter(c =>
    !candidateSearch.trim() ||
    (c.name || '').toLowerCase().includes(candidateSearch.trim().toLowerCase()) ||
    (c.email || '').toLowerCase().includes(candidateSearch.trim().toLowerCase())
  );
  const selectedCandidate = candidates.find(c => c.id === form.candidate_id) || null;

  async function handleCreate() {
    if (!form.candidate_id || !form.date) return;
    setSaving(true);
    try {
      await api.createInterview(form);
      setShowForm(false);
      setForm({ candidate_id: '', date: '', time: '10:00', timezone: 'UTC', interviewer: '', interview_round: 1, notes: '' });
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleCancel(id: string) {
    try { await api.cancelInterview(id); load(); }
    catch (e: any) { alert(e.message); }
  }

  async function handleAddSlot() {
    try { await api.createInterviewSlot(slotForm); setSlots(await api.getInterviewSlots()); }
    catch (e: any) { alert(e.message); }
  }

  async function handleDeleteSlot(id: string) {
    try { await api.deleteInterviewSlot(id); setSlots(await api.getInterviewSlots()); }
    catch (e: any) { alert(e.message); }
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Recruitment"
          title="Interviews"
          description="Schedule candidate interviews and manage your recurring availability slots."
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => setTab('interviews')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  tab === 'interviews' ? 'bg-foreground text-background shadow' : 'border border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                <CalendarDays className="h-4 w-4" /> Scheduled
              </button>
              <button
                onClick={() => setTab('slots')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  tab === 'slots' ? 'bg-foreground text-background shadow' : 'border border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                <Clock className="h-4 w-4" /> Slots
              </button>
            </div>
          }
        />
      </Reveal>

      {tab === 'interviews' && (
        <>
          <div className="flex justify-end">
            <Button variant="gold" onClick={() => setShowForm(!showForm)} className="gap-1.5">
              {showForm ? <X className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'Schedule Interview'}
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {showForm && (
              <motion.div
                key="interview-form"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="glass-card overflow-hidden rounded-3xl">
                  <div className="border-b border-border/60 px-6 py-4">
                    <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
                      <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                        <CalendarPlus className="h-4 w-4" />
                      </span>
                      Schedule Interview
                    </h2>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Candidate *</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
                        </div>
                        <Select value={form.candidate_id || undefined} onValueChange={v => setForm({...form, candidate_id: v})}>
                          <SelectTrigger><SelectValue placeholder="Select a candidate" /></SelectTrigger>
                          <SelectContent>
                            {filteredCandidates.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">No candidates found. Upload resumes first.</div>
                            ) : (
                              filteredCandidates.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name || 'Unnamed'} {c.email ? `(${c.email})` : ''}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {selectedCandidate && (
                          <p className="text-xs text-muted-foreground">
                            Selected: {selectedCandidate.name || 'Unnamed'}
                            {selectedCandidate.overall_score != null ? ` · Score ${selectedCandidate.overall_score}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date *</Label>
                        <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Time</Label>
                        <Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Interviewer</Label>
                        <Input value={form.interviewer || ''} onChange={e => setForm({...form, interviewer: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Round</Label>
                        <Input type="number" min={1} value={form.interview_round} onChange={e => setForm({...form, interview_round: parseInt(e.target.value) || 1})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Timezone</Label>
                        <Input value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea rows={3} value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
                    </div>
                    <Button variant="gold" onClick={handleCreate} disabled={saving}>
                      {saving ? 'Scheduling...' : 'Schedule'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {interviews.length === 0 ? (
            <Reveal>
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-lg shadow-gold/20">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">No interviews scheduled</h3>
                <p className="mt-1 text-sm text-muted-foreground">Schedule your first interview to get started.</p>
                <Button variant="gold" className="mt-5 gap-1.5" onClick={() => setShowForm(true)}>
                  <CalendarPlus className="h-4 w-4" /> Schedule Interview
                </Button>
              </div>
            </Reveal>
          ) : (
            <Stagger className="space-y-3.5" staggerChildren={0.05}>
              {interviews.map(iv => {
                const st = STATUS_STYLES[iv.status] || { label: iv.status, badge: 'info' as const, dot: 'bg-slate-400' };
                return (
                  <motion.div key={iv.id} variants={staggerItem} className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-gold/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <User className="h-4 w-4 text-gold" />
                            {iv.candidate_name || iv.candidate_id}
                          </span>
                          <Badge variant={st.badge} className="gap-1.5">
                            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                            {st.label}
                          </Badge>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {iv.date} at {iv.time} ({iv.timezone})
                        </p>
                        {iv.interviewer && (
                          <p className="text-sm text-muted-foreground">Interviewer: {iv.interviewer} · Round {iv.interview_round}</p>
                        )}
                        {iv.meeting_link && (
                          <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline">
                            <Video className="h-3.5 w-3.5" /> {iv.meeting_link}
                          </a>
                        )}
                      </div>
                      {iv.status === 'scheduled' && (
                        <Button size="sm" variant="destructive" className="shrink-0 gap-1.5" onClick={() => handleCancel(iv.id)}>
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </Stagger>
          )}
        </>
      )}

      {tab === 'slots' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/20">
                <Clock className="h-4 w-4" />
              </span>
              Add Availability Slot
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select value={String(slotForm.day_of_week)} onValueChange={v => setSlotForm({...slotForm, day_of_week: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dayNames.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="time" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="time" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} />
              </div>
            </div>
            <Button variant="gold" onClick={handleAddSlot} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
          </div>

          {slots.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 text-center text-muted-foreground">
              No availability slots yet. Add one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{dayNames[s.day_of_week]}</p>
                      <p className="text-sm text-muted-foreground">{s.start_time} – {s.end_time}</p>
                      <Badge variant={s.is_available ? 'info' : 'outline'} className="mt-1.5">
                        {s.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDeleteSlot(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
