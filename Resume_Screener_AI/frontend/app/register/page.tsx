'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRound, Mail, Lock } from 'lucide-react';
import { authApi, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth-shell';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const cooldownRef = useRef(0);

  function passwordStrength(pw: string): { label: string; width: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: 'Weak', width: 'w-1/4' };
    if (score <= 4) return { label: 'Medium', width: 'w-2/4' };
    if (score <= 5) return { label: 'Good', width: 'w-3/4' };
    return { label: 'Strong', width: 'w-full' };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    else if (!/[A-Za-z]/.test(password)) errs.password = 'Must contain a letter';
    else if (!/[0-9]/.test(password)) errs.password = 'Must contain a number';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      const res = await authApi.register(name, email, password);
      setToken(res.token);
      router.push('/onboarding');
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setApiError(msg);
      cooldownRef.current = Date.now() + 30000;
      if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
        cooldownRef.current = Date.now() + 60000;
      }
    } finally {
      setLoading(false);
    }
  };

  function clearErr(field: string) {
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  const strength = passwordStrength(password);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start screening resumes with AI in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-gold hover:underline">
            Sign In
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
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={e => { setName(e.target.value); clearErr('name'); }}
              className={cn('pl-9', fieldErrors.name && 'border-destructive')}
              placeholder="Jane Cooper"
            />
          </div>
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearErr('email'); }}
              className={cn('pl-9', fieldErrors.email && 'border-destructive')}
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
              autoComplete="new-password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearErr('password'); }}
              className={cn('pl-9', fieldErrors.password && 'border-destructive')}
              placeholder="••••••••"
            />
          </div>
          {password && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    strength.width,
                    strength.label === 'Weak'
                      ? 'bg-destructive'
                      : strength.label === 'Strong'
                        ? 'bg-emerald-500'
                        : 'gold-gradient',
                  )}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Strength: <span className="font-medium">{strength.label}</span>
              </p>
            </div>
          )}
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); clearErr('confirmPassword'); }}
              className={cn('pl-9', fieldErrors.confirmPassword && 'border-destructive')}
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} variant="gold" className="w-full py-2.5" size="lg">
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </AuthShell>
  );
}
