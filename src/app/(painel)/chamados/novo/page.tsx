'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { chamados as apiChamados, clientes as apiClientes, usuarios as apiUsuarios, type Cliente, type Usuario } from '@/lib/api';

export default function NovoChamadoPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [statusOpts, setStatusOpts] = useState<string[]>([]);
  const [prioridadeOpts, setPrioridadeOpts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [c, u, st, pr] = await Promise.all([
          apiClientes.list().then((r) => (r as { dados?: Cliente[] }).dados ?? (r as { clientes?: Cliente[] }).clientes ?? []),
          apiUsuarios.list(),
          apiChamados.status(),
          apiChamados.prioridades(),
        ]);
        setClientes(Array.isArray(c) ? c : []);
        const listaUsuarios = typeof u === 'object' && u && 'dados' in u && Array.isArray((u as { dados: Usuario[] }).dados) ? (u as { dados: Usuario[] }).dados : (Array.isArray(u) ? u : []);
        setUsuarios(listaUsuarios);
        setStatusOpts(Array.isArray(st) ? st : []);
        setPrioridadeOpts(Array.isArray(pr) ? pr : []);
      } catch {
        setError('Erro ao carregar dados');
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!clienteId) {
      setError('Selecione o cliente.');
      return;
    }
    setSaving(true);
    try {
      const chamado = await apiChamados.create({
        titulo,
        descricao,
        cliente: clienteId,
        responsavel: responsavelId || undefined,
        prioridade: prioridade || undefined,
      });
      router.push(`/chamados/${(chamado as { _id: string })._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar chamado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/chamados"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-slate-800">Novo chamado</h1>
      <form onSubmit={submit} className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Cliente *</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c._id} value={c._id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Responsável</label>
          <select
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="">Nenhum</option>
            {usuarios.map((u) => (
              <option key={u._id} value={u._id}>{u.nome} ({u.role})</option>
            ))}
          </select>
        </div>
        {prioridadeOpts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">—</option>
              {prioridadeOpts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Link
            href="/chamados"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {saving ? 'Criando...' : 'Criar chamado'}
          </button>
        </div>
      </form>
    </div>
  );
}
