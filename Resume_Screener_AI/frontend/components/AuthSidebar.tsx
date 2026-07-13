'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, clearToken, api } from '@/lib/api';

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
        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <span className="text-lg">🔐</span>
        Sign In
      </Link>
    );
  }

  return (
    <div>
      <Link
        href="/billing"
        className="flex items-center gap-3 px-5 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <span className="text-lg">🪙</span>
        <span>Credits</span>
        {credits !== null && (
          <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {credits}
          </span>
        )}
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full text-left"
      >
        <span className="text-lg">🚪</span>
        Sign Out
      </button>
    </div>
  );
}
