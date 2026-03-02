'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { notificacoes as apiNotif, type Notificacao } from '@/lib/api';

const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

function normalizarLista(n: unknown): Notificacao[] {
  if (Array.isArray(n)) return n;
  if (n && typeof n === 'object' && 'dados' in n && Array.isArray((n as { dados: Notificacao[] }).dados)) {
    return (n as { dados: Notificacao[] }).dados;
  }
  return [];
}

function sanitizarTextoNotif(text: string | undefined): string {
  if (!text || typeof text !== 'string') return '';
  const pareceErro = /width\s*\(\s*-1\s*\)|height\s*\(\s*-1\s*\)|Failed to load resource|\.js:\d+|404\s*\(\)|_rsc=/i.test(text);
  if (pareceErro) return 'Notificação';
  return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

export default function NotificacoesPage() {
  const [list, setList] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLida, setFiltroLida] = useState<boolean | ''>('');
  const [marcando, setMarcando] = useState(false);
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean; notif: Notificacao | null }>({ open: false, notif: null });
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [errorExcluir, setErrorExcluir] = useState('');

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

  const openExcluir = (notif: Notificacao, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setModalExcluir({ open: true, notif });
    setConfirmacaoExcluir('');
    setErrorExcluir('');
  };

  const closeExcluir = () => {
    setModalExcluir({ open: false, notif: null });
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!modalExcluir.notif || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setErrorExcluir('');
    try {
      await apiNotif.delete(modalExcluir.notif._id);
      setList((prev) => prev.filter((n) => n._id !== modalExcluir.notif!._id));
      closeExcluir();
    } catch (e) {
      setErrorExcluir(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
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
                          {sanitizarTextoNotif(n.titulo)}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{sanitizarTextoNotif(n.titulo)}</span>
                      )}
                      {!n.lida && (
                        <span className="shrink-0 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          Nova
                        </span>
                      )}
                    </div>
                    {n.mensagem && <p className="mt-1 text-sm text-slate-600">{sanitizarTextoNotif(n.mensagem)}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR') : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.lida && (
                      <button
                        type="button"
                        onClick={() => marcarLida(n._id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Marcar lida
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => openExcluir(n, e)}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalExcluir.open && modalExcluir.notif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir notificação</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Digite <strong>EXCLUIR</strong> para confirmar
              </label>
              <input
                type="text"
                value={confirmacaoExcluir}
                onChange={(e) => setConfirmacaoExcluir(e.target.value)}
                placeholder="EXCLUIR"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoComplete="off"
              />
            </div>
            {errorExcluir && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorExcluir}</div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeExcluir}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluindo || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
