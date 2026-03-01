'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Check } from 'lucide-react';
import { contatos as apiContatos, type Contato } from '@/lib/api';

export default function ContatoDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const [contato, setContato] = useState<Contato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const c = await apiContatos.get(id);
        setContato(c);
        if (!c.lido) {
          await apiContatos.marcarLido(id);
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
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{contato.nome}</h1>
            <p className="text-slate-600">{contato.email}</p>
            {contato.lido && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Lido
              </span>
            )}
          </div>
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
          {contato.createdAt && (
            <div className="text-xs text-slate-500">
              {new Date(contato.createdAt).toLocaleString('pt-BR')}
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
