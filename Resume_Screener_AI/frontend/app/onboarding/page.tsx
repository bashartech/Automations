'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, Building2, Layers, BookOpen, PartyPopper, Plus, X } from 'lucide-react';
import { api, isAuthenticated, CompanyCreate, getCompanyId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wordmark } from '@/components/brand';
import { cn } from '@/lib/utils';

const steps = [
  { label: 'Company Profile', icon: Building2 },
  { label: 'Departments', icon: Layers },
  { label: 'Knowledge Base', icon: BookOpen },
  { label: 'Complete', icon: PartyPopper },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyCreate>({
    name: '', industry: '', company_size: '', website: '',
    country: '', city: '', timezone: 'UTC', hr_email: '', contact_number: '',
  });
  const [departments, setDepartments] = useState<string[]>(['Engineering']);
  const [newDept, setNewDept] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
  }, []);

  async function handleCompanySubmit() {
    if (!company.name.trim()) return;
    setLoading(true);
    try {
      await api.registerCompany(company);
      setStep(1);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function handleDepartmentsSubmit() {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) throw new Error('No company found');
      const existing = await api.getDepartments(cid);
      const existingNames = new Set(existing.map(d => d.name.toLowerCase()));
      for (const d of departments) {
        const name = d.trim();
        if (name && !existingNames.has(name.toLowerCase())) {
          await api.createDepartment(cid, name);
          existingNames.add(name.toLowerCase());
        }
      }
      setStep(2);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function handleKnowledgeSubmit() {
    setStep(3);
  }

  function skip() { router.push('/'); }

  return (
    <div className="mesh-hero min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Wordmark />
        <Button variant="ghost" size="sm" onClick={skip}>
          Skip setup
        </Button>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const current = i === step;
              return (
                <div key={s.label} className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={cn(
                      'flex flex-col items-center gap-2',
                      i < step && 'cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-11 w-11 place-items-center rounded-2xl border transition-all duration-300',
                        done
                          ? 'gold-gradient border-transparent text-gold-foreground shadow-lg shadow-gold/25'
                          : current
                            ? 'border-gold/60 bg-gold-soft/40 text-gold'
                            : 'border-border bg-background/50 text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </span>
                    <span
                      className={cn(
                        'hidden text-[11px] font-medium uppercase tracking-wider sm:block',
                        current ? 'text-gold' : 'text-muted-foreground',
                      )}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-1 h-0.5 flex-1 rounded-full transition-colors duration-500',
                        done ? 'gold-gradient' : 'bg-border',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <div className="glass-card rounded-3xl p-8">
                <div className="mb-6">
                  <h1 className="font-display text-2xl font-semibold tracking-tight">Company Details</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Tell us about your organization</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Company Name *" className="sm:col-span-2">
                    <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} placeholder="Acme Inc." />
                  </Field>
                  <Field label="Industry">
                    <Input value={company.industry || ''} onChange={e => setCompany({ ...company, industry: e.target.value })} placeholder="e.g. Technology" />
                  </Field>
                  <Field label="Company Size">
                    <Input value={company.company_size || ''} onChange={e => setCompany({ ...company, company_size: e.target.value })} placeholder="e.g. 50-200" />
                  </Field>
                  <Field label="Website">
                    <Input value={company.website || ''} onChange={e => setCompany({ ...company, website: e.target.value })} placeholder="https://" />
                  </Field>
                  <Field label="HR Email">
                    <Input type="email" value={company.hr_email || ''} onChange={e => setCompany({ ...company, hr_email: e.target.value })} />
                  </Field>
                  <Field label="Country">
                    <Input value={company.country || ''} onChange={e => setCompany({ ...company, country: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <Input value={company.city || ''} onChange={e => setCompany({ ...company, city: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={company.contact_number || ''} onChange={e => setCompany({ ...company, contact_number: e.target.value })} />
                  </Field>
                  <Field label="Timezone">
                    <Input value={company.timezone || 'UTC'} onChange={e => setCompany({ ...company, timezone: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-7 flex gap-3">
                  <Button onClick={handleCompanySubmit} disabled={!company.name.trim() || loading} variant="gold" className="flex-1">
                    {loading ? 'Saving…' : 'Save & Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="glass-card rounded-3xl p-8">
                <div className="mb-6">
                  <h1 className="font-display text-2xl font-semibold tracking-tight">Departments</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Add departments to organize jobs and candidates</p>
                </div>
                <div className="space-y-2">
                  {departments.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={d} onChange={e => { const deps = [...departments]; deps[i] = e.target.value; setDepartments(deps); }} />
                      <Button variant="outline" size="icon" className="shrink-0 rounded-lg" onClick={() => setDepartments(departments.filter((_, j) => j !== i))} aria-label="Remove department">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="New department name" />
                  <Button
                    variant="outline"
                    onClick={() => { if (newDept.trim()) { setDepartments([...departments, newDept.trim()]); setNewDept(''); } }}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="mt-7 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleDepartmentsSubmit} disabled={loading} variant="gold" className="flex-1">
                    {loading ? 'Saving…' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="glass-card rounded-3xl p-8 text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl gold-gradient shadow-xl shadow-gold/25">
                  <BookOpen className="h-8 w-8 text-gold-foreground" />
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">Knowledge Base (Optional)</h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Fine-tune matching with your culture, values and hiring preferences. You can set this
                  up later from Settings.
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleKnowledgeSubmit} variant="gold">
                    Finish Setup
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="glass-card rounded-3xl p-8 text-center">
                <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full gold-gradient shadow-xl shadow-gold/30">
                  <PartyPopper className="h-10 w-10 text-gold-foreground" />
                </div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  You&apos;re all <span className="gold-gradient-text italic">set!</span>
                </h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  Your company is configured and ready. Create your first job or dive into the dashboard.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button onClick={() => router.push('/jobs')} variant="gold" className="px-6">
                    Create Your First Job
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')} className="px-6">
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
