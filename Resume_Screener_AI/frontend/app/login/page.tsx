'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock } from 'lucide-react';
import { authApi, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth-shell';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const cooldownRef = useRef(0);

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    const now = Date.now();
    if (now < cooldownRef.current) {
      const sec = Math.ceil((cooldownRef.current - now) / 1000);
      setApiError(`Too many attempts. Try again in ${sec}s`);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      router.push(res.user?.company_id ? '/' : '/onboarding');
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setApiError(msg);
      cooldownRef.current = Date.now() + 30000;
      if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
        cooldownRef.current = Date.now() + 60000;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace and keep hiring."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-gold hover:underline">
            Create one free
          </Link>
        </>
      }
    >
      {apiError && (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
              className={`pl-9 ${fieldErrors.email ? 'border-destructive' : ''}`}
              placeholder="you@company.com"
            />
          </div>
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
              className={`pl-9 ${fieldErrors.password ? 'border-destructive' : ''}`}
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" disabled={loading} variant="gold" className="w-full py-2.5" size="lg">
          {loading ? (
            'Signing in…'
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
