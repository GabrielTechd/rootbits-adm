'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Check, CheckCheck, Trash2, MessageSquare } from 'lucide-react';
import { contatos as apiContatos, type Contato } from '@/lib/api';

const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

function normalizarLista(c: unknown): Contato[] {
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>;
    if (Array.isArray(o.dados)) return o.dados as Contato[];
    if (Array.isArray(o.contatos)) return o.contatos as Contato[];
    if (Array.isArray(o.data)) return o.data as Contato[];
    if (Array.isArray(o.items)) return o.items as Contato[];
    if (Array.isArray(o.list)) return o.list as Contato[];
    for (const key of Object.keys(o)) {
      if (Array.isArray(o[key])) return o[key] as Contato[];
    }
  }
  return [];
}

export default function ContatosPage() {
  const [list, setList] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLido, setFiltroLido] = useState<boolean | ''>('');
  const [marcando, setMarcando] = useState(false);
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean; contato: Contato | null }>({ open: false, contato: null });
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [errorExcluir, setErrorExcluir] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filtroLido === '' ? {} : { lido: filtroLido };
        const c = await apiContatos.list(params);
        setList(normalizarLista(c));
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtroLido]);

  const marcarTodosLidos = async () => {
    setMarcando(true);
    try {
      await apiContatos.marcarTodosLidos();
      setList((prev) => prev.map((c) => ({ ...c, lido: true })));
    } finally {
      setMarcando(false);
    }
  };

  const openExcluir = (c: Contato, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalExcluir({ open: true, contato: c });
    setConfirmacaoExcluir('');
    setErrorExcluir('');
  };

  const closeExcluir = () => {
    setModalExcluir({ open: false, contato: null });
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!modalExcluir.contato || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setErrorExcluir('');
    try {
      await apiContatos.delete(modalExcluir.contato._id);
      setList((prev) => prev.filter((c) => c._id !== modalExcluir.contato!._id));
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
        <h1 className="text-2xl font-bold text-slate-800">Contatos (mensagens do site)</h1>
        <div className="flex items-center gap-2">
          <select
            value={filtroLido === '' ? 'todos' : String(filtroLido)}
            onChange={(e) => setFiltroLido(e.target.value === 'todos' ? '' : e.target.value === 'true')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="todos">Todos</option>
            <option value="false">Não lidos</option>
            <option value="true">Lidos</option>
          </select>
          <button
            type="button"
            onClick={marcarTodosLidos}
            disabled={marcando || list.every((c) => c.lido)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Marcar todos como lidos
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhuma mensagem.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50/80 text-left text-sm text-slate-600">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">Trecho</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="w-0 px-4 py-3" aria-label="Ações" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((c) => (
                  <tr
                    key={c._id}
                    className={`transition-colors hover:bg-slate-50 ${!c.lido ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/contatos/${c._id}`}
                        className="font-medium text-slate-800 hover:text-[var(--primary)] hover:underline"
                      >
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <Link href={`/contatos/${c._id}`} className="hover:text-[var(--primary)] hover:underline">
                        {c.email}
                      </Link>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-6 py-4 text-sm text-slate-500 sm:table-cell">
                      <Link href={`/contatos/${c._id}`} className="block truncate hover:text-[var(--primary)]">
                        {c.mensagem || '—'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {!c.lido && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            Novo
                          </span>
                        )}
                        {c.lido && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <Check className="h-3 w-3" /> Lido
                          </span>
                        )}
                        {c.respondido && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                            <MessageSquare className="h-3 w-3" /> Respondido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={(e) => openExcluir(c, e)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalExcluir.open && modalExcluir.contato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir mensagem</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir a mensagem de <strong>{modalExcluir.contato.nome}</strong> ({modalExcluir.contato.email})? Esta ação não pode ser desfeita.
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
