'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Bell, Mail, CheckCheck } from 'lucide-react';
import { notificacoes, contatos, type Notificacao } from '@/lib/api';

function normalizarNotificacoes(n: unknown): Notificacao[] {
  if (Array.isArray(n)) return n;
  if (n && typeof n === 'object' && 'dados' in n && Array.isArray((n as { dados: Notificacao[] }).dados)) {
    return (n as { dados: Notificacao[] }).dados;
  }
  return [];
}

export function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, loading } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [contatoCount, setContatoCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<Notificacao[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !usuario) {
      router.replace('/login');
      return;
    }
  }, [usuario, loading, router]);

  useEffect(() => {
    if (!usuario) return;
    const fetchCounts = async () => {
      try {
        const [n, c] = await Promise.all([
          notificacoes.unreadCount(),
          contatos.unreadCount(),
        ]);
        setNotifCount((n as { count: number }).count ?? 0);
        setContatoCount((c as { count: number }).count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchCounts();
    const t = setInterval(fetchCounts, 30000);
    return () => clearInterval(t);
  }, [usuario]);

  useEffect(() => {
    if (!notifOpen || !usuario) return;
    setNotifLoading(true);
    notificacoes
      .list()
      .then((res) => setNotifList(normalizarNotificacoes(res)))
      .catch(() => setNotifList([]))
      .finally(() => setNotifLoading(false));
  }, [notifOpen, usuario]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notifOpen]);

  const handleNotifClick = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await notificacoes.marcarLida(n._id);
        setNotifList((prev) => prev.map((item) => (item._id === n._id ? { ...item, lida: true } : item)));
        setNotifCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const marcarTodasLidas = async () => {
    try {
      await notificacoes.marcarTodasLidas();
      setNotifList((prev) => prev.map((n) => ({ ...n, lida: true })));
      setNotifCount(0);
    } catch {
      // ignore
    }
    setNotifOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex min-h-screen flex-col min-w-0 pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6">
          <div className="text-sm text-slate-600">
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/perfil' && 'Meu perfil'}
            {pathname.startsWith('/usuarios') && 'Usuários'}
            {pathname.startsWith('/posts') && 'Projetos / Posts'}
            {pathname.startsWith('/clientes') && 'Clientes'}
            {pathname.startsWith('/chamados') && 'Chamados'}
            {pathname.startsWith('/contatos') && 'Contatos'}
            {pathname.startsWith('/notificacoes') && 'Notificações'}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contatos"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="Contatos"
            >
              <Mail className="h-5 w-5" />
              {contatoCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-medium text-white">
                  {contatoCount > 99 ? '99+' : contatoCount}
                </span>
              )}
            </Link>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                title="Notificações"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-medium text-white">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                  <div className="border-b border-[var(--border)] bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Notificações</span>
                      {notifList.some((n) => !n.lida) && (
                        <button
                          type="button"
                          onClick={marcarTodasLidas}
                          className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Marcar todas lidas
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                      </div>
                    ) : notifList.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-500">Nenhuma notificação</p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)]">
                        {notifList.map((n) => (
                          <li key={n._id}>
                            <button
                              type="button"
                              onClick={() => handleNotifClick(n)}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${!n.lida ? 'bg-sky-50/50' : ''}`}
                            >
                              <p className="font-medium text-slate-800">{n.titulo}</p>
                              {n.mensagem && <p className="mt-0.5 line-clamp-2 text-slate-600">{n.mensagem}</p>}
                              {n.createdAt && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {new Date(n.createdAt).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
