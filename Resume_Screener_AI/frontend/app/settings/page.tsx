'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Layers,
  BookOpen,
  Scale,
  Mail,
  Save,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { api, authApi, isAuthenticated, CompanyResponse, WeightsResponse, EmailTemplate, DepartmentResponse, getCompanyId } from '@/lib/api';
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

type Tab = 'company' | 'knowledge' | 'weights' | 'templates' | 'departments';

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('company');
  const [companyId, setCompId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    authApi.me().then(u => {
      const cid = u.company_id || getCompanyId();
      if (cid) setCompId(cid);
      setLoadingAuth(false);
    }).catch(() => setLoadingAuth(false));
  }, []);

  if (loadingAuth) return <PageLoader />;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'departments', label: 'Departments', icon: Layers },
    { key: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { key: 'weights', label: 'Scoring Weights', icon: Scale },
    { key: 'templates', label: 'Email Templates', icon: Mail },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Manage your company profile, AI knowledge base, scoring weights, and email templates."
        />
      </Reveal>

      <Reveal y={18}>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-background/40 p-1.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200',
                tab === t.key ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {companyId && (
        <>
          {tab === 'company' && <CompanySettings companyId={companyId} />}
          {tab === 'departments' && <DepartmentSettings companyId={companyId} />}
          {tab === 'knowledge' && <KnowledgeSettings companyId={companyId} />}
          {tab === 'weights' && <WeightsSettings />}
          {tab === 'templates' && <EmailTemplateSettings companyId={companyId} />}
        </>
      )}
      {!companyId && (
        <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">
          No company found. Complete onboarding first.
        </div>
      )}
    </div>
  );
}

function SettingsCard({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Reveal>
      <div className="glass-card rounded-3xl p-6 md:p-8">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl gold-gradient shadow-md shadow-gold/20">
            {icon}
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
            {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
          </div>
        </div>
        {children}
      </div>
    </Reveal>
  );
}

function CompanySettings({ companyId }: { companyId: string }) {
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getCompany(companyId).then(c => {
      setCompany(c);
      setForm({
        name: c.name, industry: c.industry || '', company_size: c.company_size || '',
        website: c.website || '', country: c.country || '', city: c.city || '',
        timezone: c.timezone || 'UTC', hr_email: c.hr_email || '', contact_number: c.contact_number || '',
        logo_url: c.logo_url || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!company) return;
    setSaving(true);
    try {
      const updated = await api.updateCompany(company.id, form);
      setCompany(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-muted-foreground">Loading company...</p>;
  if (!company) return <p className="text-muted-foreground">No company found. Complete onboarding first.</p>;

  const fields = [
    { key: 'name', label: 'Company Name' },
    { key: 'logo_url', label: 'Logo URL' },
    { key: 'industry', label: 'Industry' },
    { key: 'company_size', label: 'Company Size' },
    { key: 'website', label: 'Website' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'hr_email', label: 'HR Email' },
    { key: 'contact_number', label: 'Phone' },
  ];

  return (
    <SettingsCard icon={<Building2 className="h-4 w-4" />} title="Company Profile">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(f => (
          <Field key={f.key} label={f.label} value={form[f.key]} onChange={v => setForm({...form, [f.key]: v})} />
        ))}
      </div>
      <Button variant="gold" onClick={handleSave} disabled={saving} className="mt-5 gap-1.5">
        <Save className="h-4 w-4" /> {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
      </Button>
    </SettingsCard>
  );
}

function DepartmentSettings({ companyId }: { companyId: string }) {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getDepartments(companyId).then(setDepartments).catch(() => {}).finally(() => setLoading(false));
  }, [companyId]);

  async function handleAdd() {
    if (!newDept.trim()) return;
    setSaving(true);
    try { const d = await api.createDepartment(companyId, newDept.trim()); setDepartments([...departments, d]); setNewDept(''); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <SettingsCard icon={<Layers className="h-4 w-4" />} title="Departments" desc="Group your hiring activity by department.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading departments...</p>
      ) : (
        <div className="mb-4 space-y-2">
          {departments.length === 0 && <p className="text-sm text-muted-foreground">No departments yet. Add one below.</p>}
          {departments.map(d => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-4 py-2.5">
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground">{d.id.slice(0, 8)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="Department name" disabled={saving} />
        <Button variant="outline" onClick={handleAdd} disabled={saving || !newDept.trim()} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> {saving ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </SettingsCard>
  );
}

function KnowledgeSettings({ companyId }: { companyId: string }) {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getKnowledge(companyId).then(k => {
      setForm({
        mission: k.mission || '', vision: k.vision || '', culture: k.culture || '',
        core_values: k.core_values || [], work_environment: k.work_environment || '',
        remote_policy: k.remote_policy || '', working_hours: k.working_hours || '',
        interview_process: k.interview_process || '', interview_stages: k.interview_stages || [],
        hiring_policy: k.hiring_policy || '', required_documents: k.required_documents || [],
        preferred_skills: k.preferred_skills || [], communication_style: k.communication_style || '',
        interview_days: k.interview_days || [], interview_time_slots: k.interview_time_slots || [],
        meeting_duration: k.meeting_duration || 60, timezone: k.timezone || 'UTC',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try { await api.updateKnowledge(companyId, form); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  const textAreas = [
    { key: 'mission', label: 'Mission' },
    { key: 'vision', label: 'Vision' },
    { key: 'culture', label: 'Culture' },
    { key: 'work_environment', label: 'Work Environment' },
    { key: 'remote_policy', label: 'Remote Policy' },
    { key: 'hiring_policy', label: 'Hiring Policy' },
    { key: 'communication_style', label: 'Communication Style' },
    { key: 'interview_process', label: 'Interview Process' },
  ];

  return (
    <SettingsCard
      icon={<BookOpen className="h-4 w-4" />}
      title="Company Knowledge Base"
      desc="Used by AI to score culture fit and alignment"
    >
      <div className="max-h-[600px] space-y-4 overflow-y-auto pr-1">
        {textAreas.map((f, i) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Textarea rows={i < 3 ? 3 : 2} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
          </div>
        ))}
      </div>
      <Button variant="gold" onClick={handleSave} disabled={saving} className="mt-5 gap-1.5">
        <Save className="h-4 w-4" /> {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Knowledge Base'}
      </Button>
    </SettingsCard>
  );
}

function WeightsSettings() {
  const [weights, setWeights] = useState<WeightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getWeights().then(setWeights).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!weights) return;
    setSaving(true);
    try { const updated = await api.updateWeights(weights); setWeights(updated); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!weights) return <p className="text-muted-foreground">Could not load weights.</p>;

  const fields: { key: keyof WeightsResponse; label: string }[] = [
    { key: 'skill_weight', label: 'Skill Match Weight' },
    { key: 'experience_weight', label: 'Experience Weight' },
    { key: 'education_weight', label: 'Education Weight' },
    { key: 'certification_weight', label: 'Certification Weight' },
    { key: 'project_weight', label: 'Project Weight' },
  ];

  const total = fields.reduce((sum, f) => sum + (weights[f.key] || 0), 0);

  return (
    <SettingsCard
      icon={<Scale className="h-4 w-4" />}
      title="Scoring Weights"
      desc={
        <span className={cn('flex items-center gap-1.5', total !== 100 && 'text-destructive')}>
          Total: {total}% {total !== 100 ? '(should be 100%)' : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </span>
      }
    >
      <div className="space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{f.label}</span>
              <span className="font-semibold">{weights[f.key]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[f.key]}
              onChange={e => setWeights({...weights, [f.key]: parseFloat(e.target.value)})}
              className="w-full accent-[var(--gold)]"
            />
          </div>
        ))}
      </div>
      <Button variant="gold" onClick={handleSave} disabled={saving} className="mt-5">
        {saving ? 'Saving...' : 'Save Weights'}
      </Button>
    </SettingsCard>
  );
}

function EmailTemplateSettings({ companyId }: { companyId: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'interview_scheduled', subject: '', body: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getEmailTemplates(companyId).then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  }, [companyId]);

  async function handleCreate() {
    if (!form.subject || !form.body) return;
    setSaving(true);
    try {
      await api.createEmailTemplate(companyId, form);
      setTemplates(await api.getEmailTemplates(companyId));
      setShowForm(false);
      setForm({ type: 'interview_scheduled', subject: '', body: '' });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <SettingsCard icon={<Mail className="h-4 w-4" />} title="Email Templates" desc="Templates used for automated candidate emails.">
      <Button variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1">
        {showForm ? null : <Plus className="h-3.5 w-3.5" />}
        {showForm ? 'Cancel' : 'New Template'}
      </Button>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 space-y-4 overflow-hidden rounded-2xl border border-gold/25 bg-gold-soft/10 p-4"
        >
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejection">Rejection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Subject" value={form.subject} onChange={v => setForm({...form, subject: v})} />
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea rows={6} value={form.body} onChange={e => setForm({...form, body: e.target.value})} />
          </div>
          <Button variant="gold" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </motion.div>
      )}

      {templates.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No templates yet.</p>
      ) : (
        <Stagger className="mt-4 space-y-3" staggerChildren={0.05}>
          {templates.map(t => (
            <motion.div key={t.id} variants={staggerItem} className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <div className="mb-1 flex items-center justify-between">
                <Badge variant="info" className="capitalize">{t.type.replace('_', ' ')}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{t.subject}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</p>
            </motion.div>
          ))}
        </Stagger>
      )}
    </SettingsCard>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
