'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center gap-8 py-24',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="relative h-20 w-20">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-pulse-gold"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        <motion.span
          className="absolute inset-2 rounded-full border border-gold/30"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
        />
        <motion.span
          className="absolute inset-0 m-auto h-3 w-3 rounded-full gold-gradient"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Resume Screener AI
        </p>
        <p className="text-xs text-muted-foreground/70">Loading premium experience…</p>
      </div>
    </div>
  );
}
