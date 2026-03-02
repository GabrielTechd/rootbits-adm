'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Check, Trash2 } from 'lucide-react';
import { contatos as apiContatos, type Contato } from '@/lib/api';

const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

export default function ContatoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [contato, setContato] = useState<Contato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalExcluir, setModalExcluir] = useState(false);
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [errorExcluir, setErrorExcluir] = useState('');
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await apiContatos.get(id);
        setContato(c);
        if (!c.lido) {
          await apiContatos.marcarLido(id);
          setContato((prev) => (prev ? { ...prev, lido: true } : null));
        }
      } catch {
        setContato(null);
        setError('Mensagem não encontrada.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleLido = async () => {
    if (!contato) return;
    setAtualizandoStatus(true);
    try {
      const atualizado = await apiContatos.update(contato._id, { lido: !contato.lido });
      setContato(atualizado);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const toggleRespondido = async () => {
    if (!contato) return;
    setAtualizandoStatus(true);
    try {
      const atualizado = await apiContatos.update(contato._id, { respondido: !contato.respondido });
      setContato(atualizado);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const openExcluir = () => {
    setModalExcluir(true);
    setConfirmacaoExcluir('');
    setErrorExcluir('');
  };

  const closeExcluir = () => {
    setModalExcluir(false);
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!contato || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setErrorExcluir('');
    try {
      await apiContatos.delete(contato._id);
      router.push('/contatos');
    } catch (e) {
      setErrorExcluir(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !contato) {
    return (
      <div className="space-y-6">
        <Link href="/contatos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Voltar para Contatos
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          {error || 'Mensagem não encontrada.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/contatos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para Contatos
      </Link>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{contato.nome}</h1>
              <p className="text-slate-600">{contato.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openExcluir}
            className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 border-y border-slate-100 py-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!contato.lido}
              onChange={toggleLido}
              disabled={atualizandoStatus}
              className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-slate-700">Lido</span>
            {contato.lido && <Check className="h-4 w-4 text-emerald-600" />}
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!contato.respondido}
              onChange={toggleRespondido}
              disabled={atualizandoStatus}
              className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-slate-700">Respondido</span>
          </label>
        </div>

        <dl className="space-y-4">
          {contato.telefone && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Telefone</dt>
              <dd className="text-slate-800">{contato.telefone}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Mensagem</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">{contato.mensagem}</dd>
          </div>
          {contato.observacao && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Observação</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">{contato.observacao}</dd>
            </div>
          )}
          {contato.createdAt && (
            <div className="text-xs text-slate-500">
              {new Date(contato.createdAt).toLocaleString('pt-BR')}
            </div>
          )}
        </dl>
      </div>

      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir mensagem</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir a mensagem de <strong>{contato.nome}</strong> ({contato.email})? Esta ação não pode ser desfeita.
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
