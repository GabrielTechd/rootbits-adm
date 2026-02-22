'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { posts as apiPosts, fileToDataUrl } from '@/lib/api';

export default function NovoPostPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemPrincipal, setImagemPrincipal] = useState('');
  const [imagensAdicionais, setImagensAdicionais] = useState<string[]>([]);
  const [publicado, setPublicado] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImagesRef = useRef<HTMLInputElement>(null);

  const onMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setImagemPrincipal(url);
  };

  const onAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).slice(0, 10).map(fileToDataUrl));
    setImagensAdicionais((prev) => [...prev, ...urls].slice(0, 10));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!imagemPrincipal) {
      setError('Imagem principal é obrigatória.');
      return;
    }
    setSaving(true);
    try {
      await apiPosts.create({
        titulo,
        descricao,
        imagemPrincipal,
        imagensAdicionais: imagensAdicionais.length ? imagensAdicionais : undefined,
        publicado,
      });
      router.push('/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-slate-800">Novo post / projeto</h1>
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
          <label className="block text-sm font-medium text-slate-700">Imagem principal *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onMainImage}
            className="mt-1 text-sm text-slate-600"
          />
          {imagemPrincipal && (
            <img
              src={imagemPrincipal}
              alt="Preview"
              className="mt-2 max-h-48 rounded-lg border border-[var(--border)] object-cover"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Imagens adicionais (até 10)</label>
          <input
            ref={addImagesRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onAddImages}
            className="mt-1 text-sm text-slate-600"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {imagensAdicionais.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg border border-[var(--border)] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagensAdicionais((p) => p.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <span className="text-sm text-slate-700">Publicado</span>
        </label>
        <div className="flex justify-end gap-2">
          <Link
            href="/posts"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Criar post'}
          </button>
        </div>
      </form>
    </div>
  );
}
