'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedNumber, staggerItem } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  icon,
  delay = 0,
  accent = 'default',
  sub,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  delay?: number;
  accent?: 'default' | 'gold' | 'success' | 'danger';
  sub?: string;
}) {
  const accentClasses: Record<string, string> = {
    default: 'text-foreground',
    gold: 'primary-gradient-text',
    success: 'text-emerald-500',
    danger: 'text-destructive',
  };
  const numeric = typeof value === 'number' ? value : Number(value);
  const isNumber = !Number.isNaN(numeric) && typeof value === 'number';

  return (
    <motion.div variants={staggerItem} custom={delay} initial="hidden" animate="visible" transition={{ delay }}>
      <Card className="group relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {icon}
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn('text-3xl font-bold tracking-tight', accentClasses[accent])}>
            {isNumber ? <AnimatedNumber value={numeric} /> : value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted-foreground/70">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
