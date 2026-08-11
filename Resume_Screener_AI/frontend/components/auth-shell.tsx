'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wordmark, LogoMark } from '@/components/brand';
import { Sparkles, ShieldCheck, Zap, Users } from 'lucide-react';

const perks = [
  { icon: Zap, text: 'AI parses hundreds of resumes in seconds' },
  { icon: Users, text: 'Score, compare and shortlist candidates' },
  { icon: ShieldCheck, text: 'Enterprise-grade privacy for your data' },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mesh-hero min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -left-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
          <div className="animate-float-slow absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        </div>
        <div className="relative z-10 p-12">
          <Link href="/" aria-label="Resume Screener AI home">
            <Wordmark />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 max-w-md"
          >
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              Hire at the <span className="gold-gradient-text italic">speed of AI.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Screen, score and shortlist candidates against your job descriptions — without the
              manual grind.
            </p>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 space-y-4"
          >
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient shadow-md shadow-gold/25">
                    <Icon className="h-4 w-4 text-gold-foreground" />
                  </span>
                  {p.text}
                </li>
              );
            })}
          </motion.ul>
        </div>
        <div className="relative z-10 border-t border-border/60 p-12">
          <p className="text-xs leading-relaxed text-muted-foreground">
            © {new Date().getFullYear()} Resume Screener AI. Crafted for modern recruiting teams.
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          <Link href="/" className="mb-8 flex justify-center lg:hidden" aria-label="Home">
            <LogoMark className="h-12 w-12" />
          </Link>
          <div className="glass-card rounded-3xl p-8">
            <div className="mb-7">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

export function BrandBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/50 px-3 py-1 text-xs font-medium">
      <Sparkles className="h-3.5 w-3.5 text-gold" />
      AI-powered screening
    </span>
  );
}
