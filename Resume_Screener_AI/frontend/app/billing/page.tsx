'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowRight, Plus, Minus } from 'lucide-react';
import { api, CreditBalance, CreditTransaction } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/premium-loader';
import { Reveal, AnimatedNumber } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCreditBalance().then(setBalance),
      api.getCreditHistory().then(setHistory),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Account"
          title="Billing & Credits"
          description="Monitor your credit balance and transaction history."
        />
      </Reveal>

      <Reveal y={18}>
        <div className="glass-card relative overflow-hidden rounded-3xl p-7 md:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Available Credits
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight gold-gradient-text">
                  {balance ? <AnimatedNumber value={balance.credits_remaining} /> : '0'}
                </span>
                <span className="text-lg text-muted-foreground">credits</span>
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="gold" className="gap-1.5">
                Buy Credits <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="glass-card rounded-3xl p-6 md:p-7">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <Plus className="h-4 w-4 text-gold" /> Transaction History
          </h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Reason</th>
                    <th className="pb-3 text-right font-medium">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(tx => (
                    <tr key={tx.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 capitalize">{tx.reason.replace(/_/g, ' ')}</td>
                      <td className={cn(
                        'flex items-center justify-end gap-1 py-3 font-medium',
                        tx.amount > 0 ? 'text-emerald-500' : 'text-destructive',
                      )}>
                        {tx.amount > 0 ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
