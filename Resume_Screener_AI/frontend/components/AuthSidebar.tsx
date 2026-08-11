'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, clearToken, api } from '@/lib/api';
import { LogOut, Wallet, LogIn } from 'lucide-react';

export default function AuthSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const auth = isAuthenticated();
    setLoggedIn(auth);
    if (auth) {
      api.getCreditBalance().then(b => setCredits(b.credits_remaining)).catch(() => {});
    } else {
      setCredits(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setCredits(null);
    router.push('/login');
  };

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogIn className="h-[18px] w-[18px]" />
        Sign In
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <Link
        href="/billing"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Wallet className="h-[18px] w-[18px]" />
        <span>Credits</span>
        {credits !== null && (
          <span className="ml-auto rounded-full gold-gradient px-2 py-0.5 text-xs font-semibold text-gold-foreground">
            {credits}
          </span>
        )}
      </Link>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sign Out
      </button>
    </div>
  );
}
