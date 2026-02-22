'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { notificacoes as apiNotif, type Notificacao } from '@/lib/api';

function normalizarLista(n: unknown): Notificacao[] {
  if (Array.isArray(n)) return n;
  if (n && typeof n === 'object' && 'dados' in n && Array.isArray((n as { dados: Notificacao[] }).dados)) {
    return (n as { dados: Notificacao[] }).dados;
  }
  return [];
}

export default function NotificacoesPage() {
  const [list, setList] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLida, setFiltroLida] = useState<boolean | ''>('');
  const [marcando, setMarcando] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filtroLida === '' ? {} : { lida: filtroLida };
        const n = await apiNotif.list(params);
        setList(normalizarLista(n));
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtroLida]);

  const marcarLida = async (id: string) => {
    try {
      await apiNotif.marcarLida(id);
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, lida: true } : n)));
    } catch {
      // ignore
    }
  };

  const marcarTodasLidas = async () => {
    setMarcando(true);
    try {
      await apiNotif.marcarTodasLidas();
      setList((prev) => prev.map((n) => ({ ...n, lida: true })));
    } finally {
      setMarcando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
        <div className="flex items-center gap-2">
          <select
            value={filtroLida === '' ? 'todas' : String(filtroLida)}
            onChange={(e) => setFiltroLida(e.target.value === 'todas' ? '' : e.target.value === 'true')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="todas">Todas</option>
            <option value="false">Não lidas</option>
            <option value="true">Lidas</option>
          </select>
          <button
            type="button"
            onClick={marcarTodasLidas}
            disabled={marcando || list.every((n) => n.lida)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhuma notificação.</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {list.map((n) => (
              <li
                key={n._id}
                className={`px-6 py-4 transition-colors hover:bg-slate-50 ${!n.lida ? 'bg-sky-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {n.link ? (
                        <Link
                          href={n.link}
                          className="font-medium text-slate-800 hover:text-[var(--primary)]"
                          onClick={() => !n.lida && marcarLida(n._id)}
                        >
                          {n.titulo}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{n.titulo}</span>
                      )}
                      {!n.lida && (
                        <span className="shrink-0 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          Nova
                        </span>
                      )}
                    </div>
                    {n.mensagem && <p className="mt-1 text-sm text-slate-600">{n.mensagem}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR') : ''}
                    </p>
                  </div>
                  {!n.lida && (
                    <button
                      type="button"
                      onClick={() => marcarLida(n._id)}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
