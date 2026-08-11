'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  ScanSearch,
  UploadCloud,
  History,
  BarChart3,
  Settings,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/brand';
import { ModeToggle } from '@/components/mode-toggle';
import AuthSidebar from '@/components/AuthSidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/interviews', label: 'Interviews', icon: CalendarDays },
  { href: '/analyze', label: 'Analyze', icon: ScanSearch },
  { href: '/bulk', label: 'Bulk Upload', icon: UploadCloud },
  { href: '/batches', label: 'Batch History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl lg:flex">
      <div className="flex h-20 items-center px-6">
        <Link href="/" aria-label="Resume Screener AI home">
          <Wordmark />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          Menu
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'text-gold-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl gold-gradient shadow-lg shadow-gold/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110',
                  )}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border/70 px-4 py-4">
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-dashed border-gold/40 bg-gold-soft/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span>
            AI-powered screening at <span className="font-semibold text-gold">speed</span>
          </span>
        </div>
        <AuthSidebar />
        <div className="mt-3 flex justify-center border-t border-border/70 pt-3">
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
}
