import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative grid h-9 w-9 place-items-center rounded-xl gold-gradient shadow-lg shadow-gold/25',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gold-foreground" aria-hidden>
        <path
          d="M6 4.5c1.8 0 3 .9 4.2 2.7.9 1.4 1.8 2.1 3.3 2.1H18a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6 19.5c1.8 0 3-.9 4.2-2.7.9-1.4 1.8-2.1 3.3-2.1H18a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4.5 5v5.5h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 19v-5.5h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight">Resume</p>
        <p className="gold-gradient-text text-base font-semibold tracking-tight -mt-1">
          Screener AI
        </p>
      </div>
    </div>
  );
}
