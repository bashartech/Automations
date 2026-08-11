'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Gift } from 'lucide-react';
import { api, CreditPack, isAuthenticated } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Reveal, Stagger, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getCreditPacks().then(setPacks).catch(console.error);
  }, []);

  const handleBuy = async (pack: CreditPack) => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (pack.price_cents === 0) return;
    setBuying(pack.id);
    setMsg('');
    try {
      const res = await api.createCheckout(pack.id);
      if (res.mock && res.success) {
        setMsg(`Added ${res.credits_added} credits!`);
      } else if (res.url) {
        router.push(res.url);
      }
    } catch (e: any) {
      setMsg(e.message || 'Purchase failed');
    } finally {
      setBuying(null);
    }
  };

  const freePack = packs.find(p => p.price_cents === 0);
  const paidPacks = packs.filter(p => p.price_cents > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal y={14}>
        <PageHeader
          eyebrow="Plans & Credits"
          title="Pricing"
          description="Buy credit packs to process resumes. 1 credit = 1 resume."
        />
      </Reveal>

      {freePack && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center">
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
            <p className="relative z-10 flex items-center justify-center gap-2 font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
              <Gift className="h-6 w-6" /> {freePack.credits} Free Credits
            </p>
            <p className="relative z-10 mt-1 text-sm text-emerald-600/70 dark:text-emerald-300/70">
              Included on sign-up — no payment needed
            </p>
          </div>
        </Reveal>
      )}

      <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-2" staggerChildren={0.08}>
        {paidPacks.map((pack, idx) => {
          const credits = pack.credits;
          const popular = idx === Math.max(0, Math.floor(paidPacks.length / 2));
          return (
            <motion.div
              key={pack.id}
              variants={staggerItem}
              className={cn(
                'glass-card relative flex flex-col overflow-hidden rounded-3xl p-7',
                popular && 'border-gold/50 shadow-xl shadow-gold/10',
              )}
            >
              {popular && (
                <div className="absolute right-0 top-0 rounded-bl-2xl gold-gradient px-4 py-1.5 text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl gold-gradient shadow-md shadow-gold/20">
                  <Zap className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight">{pack.name}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold tracking-tight">${(pack.price_cents / 100).toFixed(0)}</p>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {credits.toLocaleString()} credits · ${(pack.price_cents / 100 / credits).toFixed(3)}/credit
              </p>
              <div className="mt-6 flex-1" />
              <Button
                variant={popular ? 'gold' : 'outline'}
                onClick={() => handleBuy(pack)}
                disabled={buying === pack.id}
                className="w-full"
              >
                {buying === pack.id ? 'Processing...' : 'Buy Now'}
              </Button>
            </motion.div>
          );
        })}
      </Stagger>

      {msg && (
        <Reveal>
          <div className="flex items-center gap-2.5 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" /> {msg}
          </div>
        </Reveal>
      )}
    </div>
  );
}
