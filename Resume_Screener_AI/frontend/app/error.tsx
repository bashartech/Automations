'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6">
        <p className="font-display text-6xl font-semibold tracking-tight">
          O<span className="gold-gradient-text">ops</span>!
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button onClick={reset} variant="gold" className="px-6">
            Try again
          </Button>
          <Button asChild variant="outline" className="px-6">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
