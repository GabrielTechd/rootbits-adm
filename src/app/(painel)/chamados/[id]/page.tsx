'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { MessageModal } from '@/components/MessageModal';
import { UserAvatarNome } from '@/components/UserAvatarNome';
import { chamados as apiChamados, type Chamado, type Usuario } from '@/lib/api';

export default function ChamadoDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagemModal, setMensagemModal] = useState<{ open: boolean; title: string; message: string; variant: 'error' | 'success' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const c = await apiChamados.get(id);
        setChamado(c);
      } catch {
        setChamado(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addComentario = async () => {
    if (!novoComentario.trim()) return;
    setEnviando(true);
    try {
      const c = await apiChamados.comentario(id, novoComentario.trim());
      setChamado(c);
      setNovoComentario('');
    } catch (e) {
      setMensagemModal({
        open: true,
        title: 'Erro',
        message: e instanceof Error ? e.message : 'Erro ao enviar',
        variant: 'error',
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Chamado não encontrado.
        <Link href="/chamados" className="mt-4 inline-block text-sm font-medium underline">Voltar</Link>
      </div>
    );
  }

  const clienteNome = typeof chamado.cliente === 'object' && chamado.cliente && 'nome' in chamado.cliente
    ? (chamado.cliente as { nome: string }).nome
    : '—';
  const responsavel = typeof chamado.responsavel === 'object' && chamado.responsavel && 'nome' in chamado.responsavel
    ? (chamado.responsavel as Usuario)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/chamados"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{chamado.titulo}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{chamado.status}</span>
              {chamado.prioridade && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800">{chamado.prioridade}</span>
              )}
              <span>Cliente: {clienteNome}</span>
              <span className="flex items-center gap-2">
                Responsável:{' '}
                {responsavel ? (
                  <UserAvatarNome nome={responsavel.nome} avatar={responsavel.avatar} size="sm" />
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>
        </div>
        {chamado.descricao && (
          <p className="mt-4 text-slate-600">{chamado.descricao}</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Comentários</h2>
        <ul className="mt-4 space-y-4">
          {(chamado.comentarios ?? []).map((com, i) => {
            const autor = typeof com.autor === 'object' && com.autor && 'nome' in com.autor ? (com.autor as Usuario) : null;
            return (
              <li key={i} className="rounded-lg border border-[var(--border)] bg-slate-50/50 p-4">
                <p className="text-sm text-slate-700">{com.texto}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  {autor ? (
                    <UserAvatarNome nome={autor.nome} avatar={autor.avatar} size="sm" />
                  ) : (
                    <span>—</span>
                  )}
                  {com.createdAt && (
                    <span>{new Date(com.createdAt).toLocaleString('pt-BR')}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Adicionar comentário..."
            rows={2}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <button
            type="button"
            onClick={addComentario}
            disabled={enviando || !novoComentario.trim()}
            className="flex items-center gap-2 self-end rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Enviar
          </button>
        </div>
      </div>

      <MessageModal
        open={mensagemModal.open}
        title={mensagemModal.title}
        message={mensagemModal.message}
        variant={mensagemModal.variant}
        onClose={() => setMensagemModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}
