'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center mesh-bg px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <LogoMark className="mx-auto h-14 w-14" />
        <div>
          <p className="font-display text-7xl font-semibold tracking-tight text-foreground">
            4<span className="gold-gradient-text">0</span>4
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
        </div>
        <Button asChild variant="gold" className="px-6">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </motion.div>
    </div>
  );
}
