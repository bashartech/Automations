'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { isAuthenticated } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';

const standaloneRoutes = new Set(['/login', '/register', '/onboarding']);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [pathname]);

  const standalone =
    standaloneRoutes.has(pathname) || (pathname === '/' && authed !== true);

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="relative min-w-0 flex-1 mesh-bg">
          <div className="grain" />
          <div className={cn('mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pt-10')}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
