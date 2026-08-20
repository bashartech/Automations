'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Users,
  CalendarDays,
  Zap,
  ShieldCheck,
  BarChart3,
  ScanSearch,
  UploadCloud,
  Check,
  Gauge,
  Target,
  Trophy,
  Timer,
  ListChecks,
  FileText,
  CalendarPlus,
  TrendingUp,
} from 'lucide-react';
import { Wordmark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Reveal, Stagger, staggerItem, AnimatedNumber } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = 'center',
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' ? 'mx-auto text-center' : '')}>
      <Reveal y={14}>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
        {sub && <p className="mt-4 text-pretty text-muted-foreground">{sub}</p>}
      </Reveal>
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

export function LandingHero() {
  const reduce = useReducedMotion();
  return (
    <div className="relative overflow-hidden mesh-hero">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42rem] opacity-60"
      >
        <div className="animate-aurora absolute -right-24 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_30%,transparent),transparent_65%)] blur-2xl" />
        <div className="animate-float-slow absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--ring)_26%,transparent),transparent_62%)] blur-2xl" />
      </div>
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 z-[1] h-[40rem]" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Wordmark />
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="gold" asChild>
            <Link href="/register">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button variant="gold" size="sm" asChild className="sm:hidden">
          <Link href="/register">Start free</Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-14 md:pt-24">
        <div className="text-center">
          <AnimatedGroup variants={transitionVariants}>
            <div className="glass mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>
                AI-powered resume screening, <span className="text-gold">10x faster</span>
              </span>
            </div>
          </AnimatedGroup>

          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            <TextEffect per="word" as="span" preset="blur" delay={0.25} className="font-display">
              Screen hundreds of resumes
            </TextEffect>
            <br />
            <TextEffect
              per="word"
              as="span"
              preset="blur"
              delay={0.45}
              className="font-display gold-gradient-text italic"
            >
              in seconds.
            </TextEffect>
          </h1>

          <AnimatedGroup variants={transitionVariants}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Resume Screener AI parses, scores and shortlists candidates against your job
              descriptions — so your team spends time on people, not paperwork.
            </p>
          </AnimatedGroup>

          <AnimatedGroup
            variants={{
              container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.6 } } },
              ...transitionVariants,
            }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button variant="gold" size="lg" className="group px-7 text-base" asChild>
              <Link href="/register">
                Start screening free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-7 text-base" asChild>
              <Link href="/login">Sign in to dashboard</Link>
            </Button>
          </AnimatedGroup>
        </div>

        {!reduce && (
          <AnimatedGroup
            variants={{
              container: { visible: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } },
              item: {
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
              },
            }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            <div className="animate-float-slow absolute -left-6 -top-8 z-20 hidden items-center gap-2 rounded-2xl border border-gold/30 bg-background/80 px-4 py-3 shadow-xl shadow-gold/10 backdrop-blur-md md:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <Zap className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Avg match score</p>
                <p className="text-sm font-bold">92%</p>
              </div>
            </div>
            <div className="animate-float-slow absolute -bottom-8 -right-4 z-20 hidden items-center gap-2 rounded-2xl border border-gold/30 bg-background/80 px-4 py-3 shadow-xl shadow-gold/10 backdrop-blur-md md:flex [animation-delay:1.2s]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                <Timer className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Time saved</p>
                <p className="text-sm font-bold">41 hrs / week</p>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden rounded-3xl p-2 md:p-3">
              <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
              <div className="rounded-2xl border border-border/70 bg-background/70 p-5 backdrop-blur-sm md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Dashboard
                    </p>
                    <p className="mt-1 text-lg font-semibold">Hiring Overview</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                      64 shortlisted
                    </span>
                    <span className="rounded-full border border-gold/40 bg-gold-soft/50 px-3 py-1 text-xs font-medium text-gold">
                      92 avg score
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: 'Resumes', v: '1,248' },
                    { label: 'Candidates', v: '205' },
                    { label: 'Jobs', v: '18' },
                    { label: 'Interviews', v: '32' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-border/70 bg-background/60 p-4"
                    >
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { k: 'Backend Engineer', w: '82%', c: 'bg-emerald-500' },
                    { k: 'Frontend Engineer', w: '71%', c: 'bg-gold' },
                    { k: 'Data Scientist', w: '64%', c: 'bg-blue-500' },
                  ].map((r) => (
                    <div key={r.k}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">{r.k}</span>
                        <span className="font-medium">{r.w}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: r.w }}
                          transition={{ duration: 1.2, delay: 1.2, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', r.c)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedGroup>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------- Stats --------------------------------- */

const stats = [
  { icon: ScanSearch, value: 1248, suffix: '+', label: 'Resumes screened', accent: 'gold' },
  { icon: Timer, value: 10, suffix: 'x', label: 'Faster than manual review', accent: 'gold' },
  { icon: Target, value: 92, suffix: '%', label: 'Average match accuracy', accent: 'gold' },
  { icon: TrendingUp, value: 41, suffix: 'hrs', label: 'Saved per recruiter, weekly', accent: 'gold' },
];

export function LandingStats() {
  const reduce = useReducedMotion();
  return (
    <section className="border-y border-border/60 bg-muted/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4" staggerChildren={0.08}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={staggerItem} className="text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-gold/25 bg-gold-soft/20">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <p className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                  {reduce ? (
                    s.value.toLocaleString()
                  ) : (
                    <AnimatedNumber value={s.value} />
                  )}
                  <span className="gold-gradient-text">{s.suffix}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* -------------------------------- Features -------------------------------- */

const features = [
  {
    icon: ScanSearch,
    title: 'AI Resume Parsing',
    desc: 'Extract skills, experience, education and certifications from hundreds of resumes in seconds.',
  },
  {
    icon: Zap,
    title: 'Job Matching',
    desc: 'Score every candidate against a job description with explainable, weighted skill analysis.',
  },
  {
    icon: Users,
    title: 'Candidate Pipeline',
    desc: 'Track status, compare top candidates side-by-side and move your strongest fits forward.',
  },
  {
    icon: CalendarDays,
    title: 'Smart Interviews',
    desc: 'Schedule interviews with Google Meet links and invites, auto-synced to your calendar.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Funnels, category distribution, top skills and processing metrics at a glance.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Ready',
    desc: 'Duplicate detection, batch history, team knowledge base and granular company settings.',
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <SectionHeading
        eyebrow="Everything you need"
        title={
          <>
            One platform for the whole{' '}
            <span className="gold-gradient-text italic">hiring pipeline</span>
          </>
        }
        sub="From first resume to booked interview, Resume Screener AI keeps every step fast, consistent and transparent."
      />

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/10 blur-2xl transition-all duration-500 group-hover:bg-gold/25" />
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl gold-gradient shadow-lg shadow-gold/25">
                <Icon className="h-5 w-5 text-gold-foreground" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------- Workflow -------------------------------- */

const workflowSteps = [
  {
    n: '01',
    icon: UploadCloud,
    title: 'Upload resumes',
    desc: 'Drop files, upload a ZIP, or point to a folder. PDFs, DOCX and images are handled automatically.',
    points: ['Bulk ZIP & folder upload', 'OCR for scanned documents', 'Auto-resume on failures'],
  },
  {
    n: '02',
    icon: ScanSearch,
    title: 'AI extracts the profile',
    desc: 'Every resume becomes a structured profile — skills, experience, education, certifications and projects.',
    points: ['Structured candidate profiles', 'Duplicate detection', 'Instant preview & edit'],
  },
  {
    n: '03',
    icon: FileText,
    title: 'Add a job description',
    desc: 'Paste a JD or create one inline. AI reviews it and suggests clearer, more inclusive wording.',
    points: ['AI job description review', 'Missing-skill detection', 'One-click improved drafts'],
  },
  {
    n: '04',
    icon: Gauge,
    title: 'Score every candidate',
    desc: 'Each candidate is scored against the JD with weighted, explainable skill analysis — no black boxes.',
    points: ['Weighted scoring engine', 'Category badges & strengths', 'Explainable recommendations'],
  },
  {
    n: '05',
    icon: ListChecks,
    title: 'Shortlist & compare',
    desc: 'Filter, bulk-update status and compare top candidates side by side before your team invests time.',
    points: ['Side-by-side comparison', 'Bulk actions & exports', 'Smart semantic search'],
  },
  {
    n: '06',
    icon: CalendarPlus,
    title: 'Schedule interviews',
    desc: 'Book interviews against your availability slots, with invites and meeting links synced automatically.',
    points: ['Recurring availability slots', 'Automated calendar invites', 'Google Meet links'],
  },
];

export function LandingWorkflow() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.72', 'end 0.55'],
  });

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-muted/30 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From resume dump to{' '}
              <span className="gold-gradient-text italic">first hire</span>
            </>
          }
          sub="A clear, automated workflow that takes your hiring from zero to scheduled interviews without lifting a finger."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-4xl">
          <div
            aria-hidden
            className="absolute left-4 top-0 h-full w-px bg-border/70 md:left-1/2 md:-translate-x-1/2"
          />
          {!reduce && (
            <motion.div
              aria-hidden
              style={{ scaleY: scrollYProgress }}
              className="absolute left-4 top-0 h-full w-px origin-top gold-gradient md:left-1/2 md:-translate-x-1/2"
            />
          )}

          <div className="space-y-12 md:space-y-16">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, x: reduce ? 0 : left ? -32 : 32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'relative pl-14 md:w-1/2 md:pl-0',
                    left ? 'md:pr-14' : 'md:ml-auto md:pl-14',
                  )}
                >
                  <div
                    className={cn(
                      'absolute left-4 top-0 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-gold/40 bg-background shadow-md shadow-gold/20 md:left-auto',
                      left ? 'md:-right-[18px] md:translate-x-0' : 'md:-left-[18px] md:translate-x-0',
                    )}
                  >
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <div
                    className={cn(
                      'glass-card group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40',
                      left ? 'md:text-right' : 'md:text-left',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl font-bold text-gold/60">{step.n}</span>
                      <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                    <ul
                      className={cn(
                        'mt-4 space-y-1.5',
                        left ? 'md:flex md:flex-col md:items-end' : '',
                      )}
                    >
                      {step.points.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Showcase -------------------------------- */

const showcases = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    heading: 'A live pulse on your pipeline',
    desc: 'Key metrics, category distribution and funnel health — all updated in real time.',
    body: <ShowcaseDashboard />,
  },
  {
    key: 'candidates',
    label: 'Candidates',
    icon: Users,
    heading: 'Every profile, structured',
    desc: 'Search, filter, compare and act on candidates from a single ranked view.',
    body: <ShowcaseCandidates />,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    heading: 'Prove what is working',
    desc: 'Funnels, top skills and processing performance to guide your strategy.',
    body: <ShowcaseAnalytics />,
  },
  {
    key: 'interviews',
    label: 'Interviews',
    icon: CalendarDays,
    heading: 'From shortlist to booked',
    desc: 'Schedule against availability slots with invites and meeting links handled.',
    body: <ShowcaseInterviews />,
  },
];

export function LandingShowcase() {
  const [active, setActive] = useState(showcases[0].key);
  const current = showcases.find((s) => s.key === active)!;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <SectionHeading
        eyebrow="Product tour"
        title={
          <>
            Built for the way{' '}
            <span className="gold-gradient-text italic">you hire</span>
          </>
        }
        sub="Explore the workspace your team will live in — from the overview dashboard to scheduled interviews."
      />

      <Reveal className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {showcases.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
                active === s.key
                  ? 'bg-foreground text-background shadow-lg'
                  : 'border border-border/60 text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </Reveal>

      <Reveal y={24} className="mt-10">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card overflow-hidden rounded-3xl p-2 md:p-3"
        >
          <div className="rounded-2xl border border-border/70 bg-background/70 p-5 backdrop-blur-sm md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {current.label}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {current.heading}
                </h3>
              </div>
              <span className="hidden shrink-0 rounded-full border border-gold/30 bg-gold-soft/40 px-3 py-1 text-xs font-medium text-gold sm:block">
                {current.desc}
              </span>
            </div>
            {current.body}
          </div>
        </motion.div>
      </Reveal>
    </section>
  );
}

function MockBar({ label, value, barClass, delay }: { label: string; value: string; barClass: string; delay: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: value }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay, ease: 'easeOut' }}
          className={cn('h-full rounded-full', barClass)}
        />
      </div>
    </div>
  );
}

function ShowcaseDashboard() {
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Resumes', v: '1,248' },
          { label: 'Shortlisted', v: '64' },
          { label: 'Interviews', v: '32' },
          { label: 'Hired', v: '9' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="rounded-xl border border-border/70 bg-background/60 p-4"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.v}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category distribution
          </p>
          <MockBar label="Strong match" value="82%" barClass="gold-gradient" delay={0.1} />
          <MockBar label="Good match" value="58%" barClass="bg-emerald-500" delay={0.2} />
          <MockBar label="Average" value="34%" barClass="bg-blue-500" delay={0.3} />
        </div>
        <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Candidate funnel
          </p>
          <MockBar label="New" value="100%" barClass="gold-gradient" delay={0.1} />
          <MockBar label="Shortlisted" value="72%" barClass="bg-emerald-500" delay={0.2} />
          <MockBar label="Interviewed" value="45%" barClass="bg-blue-500" delay={0.3} />
          <MockBar label="Hired" value="18%" barClass="bg-amber-500" delay={0.4} />
        </div>
      </div>
    </div>
  );
}

function ShowcaseCandidates() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Sarah Chen', role: 'Senior Frontend Engineer', score: 94, badge: 'Strong match', tone: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
        { name: 'Marcus Reid', role: 'Backend Engineer', score: 88, badge: 'Strong match', tone: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
        { name: 'Aisha Patel', role: 'Data Scientist', score: 71, badge: 'Good match', tone: 'text-gold', bg: 'bg-gold-soft/30 border-gold/30 text-gold' },
      ].map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full gold-gradient font-semibold">
              {c.name.split(' ').map((n) => n[0]).join('')}
            </span>
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('hidden rounded-full border px-2.5 py-1 text-[11px] font-medium sm:block', c.bg)}>
              {c.badge}
            </span>
            <span className={cn('text-xl font-bold', c.tone)}>{c.score}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ShowcaseAnalytics() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: 'Avg match score', v: '92%', icon: Target, cls: 'text-emerald-500' },
        { label: 'Processing time', v: '3.4s', icon: Timer, cls: 'text-gold' },
        { label: 'Duplicates found', v: '41', icon: ScanSearch, cls: 'text-blue-500' },
        { label: 'Top skill', v: 'React', icon: Trophy, cls: 'text-amber-500' },
      ].map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            className="rounded-xl border border-border/60 bg-background/50 p-4 text-center"
          >
            <Icon className={cn('mx-auto mb-2 h-5 w-5', s.cls)} />
            <p className="text-xl font-bold">{s.v}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function ShowcaseInterviews() {
  return (
    <div className="space-y-3">
      {[
        { who: 'Sarah Chen', when: 'Tue, Mar 18 · 10:00', round: 'Round 1', badge: 'Scheduled', badgeCls: 'bg-sky-500/10 border-sky-500/30 text-sky-500' },
        { who: 'Marcus Reid', when: 'Wed, Mar 19 · 14:00', round: 'Technical', badge: 'Scheduled', badgeCls: 'bg-sky-500/10 border-sky-500/30 text-sky-500' },
        { who: 'Aisha Patel', when: 'Fri, Mar 21 · 11:30', round: 'Final', badge: 'Completed', badgeCls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
      ].map((iv, i) => (
        <motion.div
          key={iv.who}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">{iv.who}</p>
              <p className="text-xs text-muted-foreground">
                {iv.when} · {iv.round}
              </p>
            </div>
          </div>
          <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', iv.badgeCls)}>
            {iv.badge}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ----------------------------------- CTA ----------------------------------- */

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="glass-card relative overflow-hidden rounded-3xl px-6 py-16 text-center md:py-20"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl gold-gradient shadow-xl shadow-gold/30">
            <UploadCloud className="h-7 w-7 text-gold-foreground" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Ready to hire <span className="gold-gradient-text italic">smarter?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Create your company workspace and start screening your first batch of resumes in
            minutes — no credit card required.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="gold" size="lg" className="group px-8 text-base" asChild>
              <Link href="/register">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-base" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {['AI parsing', 'Job matching', 'Interview scheduling'].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 text-gold" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Footer ---------------------------------- */

const footerLinks = [
  { label: 'How it works', href: '/#workflow' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Sign in', href: '/login' },
  { label: 'Get started', href: '/register' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <Wordmark />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Resume Screener AI. Hire at the speed of AI.
        </p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          {footerLinks.map((l) => (
            <Link key={l.label} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
