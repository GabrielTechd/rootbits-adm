'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (usuario) router.replace('/dashboard');
  }, [usuario, router]);

  if (usuario) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      router.replace('/dashboard');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-800">Rootbits Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Entre com seu e-mail e senha</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="admin@rootbits.com.br"
                />
              </div>
            </div>
            <div>
              <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <PasswordInput
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg bg-[var(--primary)] py-2.5 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Painel administrativo Rootbits · Acesso restrito
        </p>
      </div>
    </div>
  );
}
