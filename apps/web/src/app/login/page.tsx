'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import apiClient, { LoginResponse, storeAccessToken } from '../../lib/api/client';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(' ');
    }
    if (!error.response) {
      return 'Cannot reach the API. Check that it is running and try again.';
    }
  }
  return 'Sign in failed. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      storeAccessToken(data.accessToken);
      router.replace('/dashboard');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-xl font-bold ring-1 ring-white/20">W</div>
              <span className="text-xl font-bold">WorkforceIQ</span>
            </div>
            <div className="mt-28 max-w-lg">
              <div className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.2em] text-blue-100">Workforce Intelligence</div>
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">Make every workforce decision with confidence.</h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-blue-100/80">A unified HR and payroll workspace for people, organizations and financial operations.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-8 text-xs text-blue-100/70"><span>People</span><span>Payroll</span><span>Analytics</span><span>2026 Demo</span></div>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3 text-white"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-xl font-bold">W</div><span className="text-xl font-bold">WorkforceIQ</span></div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.06] p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">Sign in to your WorkforceIQ workspace.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-slate-300">Email address</label>
                  <input id="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required maxLength={255} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</label>
                  <input id="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required maxLength={128} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" />
                </div>
                {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
                <button disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">
                  {isSubmitting ? 'Signing in…' : 'Sign in to WorkforceIQ'}
                </button>
              </form>
              <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center text-[11px] text-blue-200">Use the local admin credentials configured in the root .env file.</div>
            </div>
            <p className="mt-6 text-center text-[10px] text-slate-600">© 2026 WorkforceIQ · HR & Payroll Intelligence Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
