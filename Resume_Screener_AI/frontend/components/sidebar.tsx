'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/candidates', label: 'Candidates', icon: Users },
      { href: '/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/interviews', label: 'Interviews', icon: CalendarDays },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/analyze', label: 'Analyze', icon: ScanSearch },
      { href: '/bulk', label: 'Bulk Upload', icon: UploadCloud },
      { href: '/batches', label: 'Batch History', icon: History },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/pricing', label: 'Pricing', icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-border/70 px-6">
        <Link href="/" aria-label="Resume Screener AI home">
          <Wordmark />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0 h-5 w-[3px] rounded-r-full bg-primary transition-opacity duration-200',
                          active ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors duration-200',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border/70 px-3 pb-4 pt-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg primary-gradient shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold-foreground" />
          </span>
          <span>
            AI-powered screening at{' '}
            <span className="font-semibold text-primary">speed</span>
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
