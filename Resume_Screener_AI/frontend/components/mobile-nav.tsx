'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import AuthSidebar from '@/components/AuthSidebar';
import { Wordmark } from '@/components/brand';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/candidates', label: 'Candidates' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/interviews', label: 'Interviews' },
  { href: '/analyze', label: 'Analyze' },
  { href: '/bulk', label: 'Bulk Upload' },
  { href: '/batches', label: 'Batch History' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
  { href: '/pricing', label: 'Pricing' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            data-testid="mobile-menu"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            className="rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" aria-label="Resume Screener AI home">
            <Wordmark className="scale-90" />
          </Link>
        </div>
        <ModeToggle />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <Wordmark />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg text-sidebar-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <nav className="space-y-1">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>
              <div className="border-t border-border/70 px-3 py-3">
                <AuthSidebar />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
