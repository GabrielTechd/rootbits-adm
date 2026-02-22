'use client';

import { useEffect, useState } from 'react';
import { Mail, Check, CheckCheck } from 'lucide-react';
import { contatos as apiContatos, type Contato } from '@/lib/api';

export default function ContatosPage() {
  const [list, setList] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLido, setFiltroLido] = useState<boolean | ''>('');
  const [detalhe, setDetalhe] = useState<Contato | null>(null);
  const [marcando, setMarcando] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filtroLido === '' ? {} : { lido: filtroLido };
        const c = await apiContatos.list(params);
        setList(Array.isArray(c) ? c : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtroLido]);

  const marcarLido = async (id: string) => {
    setMarcando(true);
    try {
      await apiContatos.marcarLido(id);
      setList((prev) => prev.map((c) => (c._id === id ? { ...c, lido: true } : c)));
      if (detalhe?._id === id) setDetalhe((d) => (d ? { ...d, lido: true } : null));
    } finally {
      setMarcando(false);
    }
  };

  const marcarTodosLidos = async () => {
    setMarcando(true);
    try {
      await apiContatos.marcarTodosLidos();
      setList((prev) => prev.map((c) => ({ ...c, lido: true })));
      if (detalhe) setDetalhe((d) => (d ? { ...d, lido: true } : null));
    } finally {
      setMarcando(false);
    }
  };

  const verDetalhe = async (c: Contato) => {
    setDetalhe(c);
    if (!c.lido) await marcarLido(c._id);
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhuma mensagem.</div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {list.map((c) => (
                <li
                  key={c._id}
                  className={`cursor-pointer px-6 py-4 transition-colors hover:bg-slate-50 ${detalhe?._id === c._id ? 'bg-sky-50' : ''} ${!c.lido ? 'bg-amber-50/50' : ''}`}
                  onClick={() => verDetalhe(c)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 truncate">{c.nome}</span>
                        {!c.lido && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            Novo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-600">{c.email}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.mensagem}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          {detalhe ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Mensagem</h2>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Nome</dt>
                  <dd className="text-slate-800">{detalhe.nome}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">E-mail</dt>
                  <dd className="text-slate-800">{detalhe.email}</dd>
                </div>
                {detalhe.telefone && (
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500">Telefone</dt>
                    <dd className="text-slate-800">{detalhe.telefone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Mensagem</dt>
                  <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">{detalhe.mensagem}</dd>
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  {detalhe.lido && <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Lido</span>}
                  {detalhe.createdAt && <span>{new Date(detalhe.createdAt).toLocaleString('pt-BR')}</span>}
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-center text-slate-500">Selecione uma mensagem para ver o conteúdo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
