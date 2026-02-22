'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, Headphones } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { chamados as apiChamados, type Chamado } from '@/lib/api';

export default function ChamadosPage() {
  const { can } = useAuth();
  const [list, setList] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusOpts, setStatusOpts] = useState<string[]>([]);
  const [filtro, setFiltro] = useState({ status: '' });
  const canCreate = can(['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte']);

  useEffect(() => {
    const load = async () => {
      try {
        const [ch, st] = await Promise.all([apiChamados.list(), apiChamados.status()]);
        setList((ch as { chamados?: Chamado[] }).chamados ?? []);
        setStatusOpts(Array.isArray(st) ? st : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filtro.status ? { status: filtro.status } : {};
        const ch = await apiChamados.list(params);
        setList((ch as { chamados?: Chamado[] }).chamados ?? []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtro.status]);

  const clienteNome = (c: Chamado) =>
    typeof c.cliente === 'object' && c.cliente && 'nome' in c.cliente
      ? (c.cliente as { nome: string }).nome
      : '—';
  const responsavelNome = (c: Chamado) =>
    typeof c.responsavel === 'object' && c.responsavel && 'nome' in c.responsavel
      ? (c.responsavel as { nome: string }).nome
      : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Chamados</h1>
        {canCreate && (
          <Link
            href="/chamados/novo"
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo chamado
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <select
          value={filtro.status}
          onChange={(e) => setFiltro((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">Todos os status</option>
          {statusOpts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum chamado encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-700">Título</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Cliente</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Prioridade</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Responsável</th>
                  <th className="px-6 py-4 font-medium text-slate-700 w-20">Ação</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b border-[var(--border)] hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Headphones className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{c.titulo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{clienteNome(c)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.prioridade || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{responsavelNome(c)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/chamados/${c._id}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Ver"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
