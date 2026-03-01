'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { posts as apiPosts, clientes as apiClientes, fileToDataUrl, type Post, type Cliente } from '@/lib/api';

function normalizarClientes(c: unknown): Cliente[] {
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object' && 'dados' in c && Array.isArray((c as { dados: Cliente[] }).dados)) return (c as { dados: Cliente[] }).dados;
  return [];
}

export default function EditarPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [form, setForm] = useState<Partial<Post>>({});
  const [imagemPrincipal, setImagemPrincipal] = useState('');
  const [imagensAdicionais, setImagensAdicionais] = useState<string[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImagesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c] = await Promise.all([apiPosts.get(id), apiClientes.list()]);
        setPost(p);
        setForm({
          titulo: p.titulo,
          subtitulo: p.subtitulo ?? '',
          descricao: p.descricao ?? '',
          tags: p.tags ?? [],
          desafio: p.desafio ?? '',
          resultado: p.resultado ?? '',
          oQueFoiFeito: p.oQueFoiFeito ?? [],
          ctaTexto: p.ctaTexto ?? 'Quero um resultado como esse',
          ctaLinkTexto: p.ctaLinkTexto ?? 'Ver outros projetos',
          publicado: p.publicado ?? false,
          ordem: p.ordem ?? 0,
          clienteRef: p.clienteRef ?? undefined,
        });
        setImagemPrincipal(p.imagemPrincipal ?? '');
        setImagensAdicionais(p.imagensAdicionais ?? []);
        setClientes(normalizarClientes(c));
      } catch {
        setError('Post não encontrado');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const setFormField = <K extends keyof Post>(key: K, value: Post[K]) => setForm((f) => ({ ...f, [key]: value }));

  const tagsStr = Array.isArray(form.tags) ? form.tags.join(', ') : (form.tags as string) ?? '';
  const setTagsStr = (s: string) => setFormField('tags', s ? s.split(',').map((t) => t.trim()).filter(Boolean) : []);

  const oQueFoiFeitoList = Array.isArray(form.oQueFoiFeito) ? form.oQueFoiFeito : [];
  const addOQueFoiFeito = () => setFormField('oQueFoiFeito', [...oQueFoiFeitoList, '']);
  const setOQueFoiFeitoItem = (i: number, v: string) =>
    setFormField('oQueFoiFeito', oQueFoiFeitoList.map((item, j) => (j === i ? v : item)));
  const removeOQueFoiFeito = (i: number) => setFormField('oQueFoiFeito', oQueFoiFeitoList.filter((_, j) => j !== i));

  const onMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setImagemPrincipal(url);
  };

  const onAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).slice(0, 10 - imagensAdicionais.length).map((f) => fileToDataUrl(f)));
    setImagensAdicionais((prev) => [...prev, ...urls].slice(0, 10));
    e.target.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiPosts.update(id, {
        ...form,
        titulo: form.titulo!,
        descricao: form.descricao || undefined,
        imagemPrincipal: imagemPrincipal || undefined,
        imagensAdicionais: imagensAdicionais.length ? imagensAdicionais : undefined,
        tags: Array.isArray(form.tags) && form.tags.length ? form.tags : undefined,
        oQueFoiFeito: oQueFoiFeitoList.filter(Boolean).length ? oQueFoiFeitoList.filter(Boolean) : undefined,
        ordem: form.ordem ?? 0,
        clienteRef: form.clienteRef || undefined,
      });
      router.push('/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        {error}
        <Link href="/posts" className="mt-4 inline-block text-sm font-medium underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-slate-800">Editar estudo de caso</h1>

      <form onSubmit={submit} className="space-y-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

        {/* 1. Cabeçalho */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Cabeçalho do caso</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Título *</label>
              <input
                type="text"
                value={form.titulo ?? ''}
                onChange={(e) => setFormField('titulo', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Subtítulo</label>
              <input
                type="text"
                value={form.subtitulo ?? ''}
                onChange={(e) => setFormField('subtitulo', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tags</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="E-commerce, UX, SEO"
              />
            </div>
          </div>
        </section>

        {/* 2. Desafio e resultado */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Desafio e resultado</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Desafio</label>
              <textarea
                value={form.desafio ?? ''}
                onChange={(e) => setFormField('desafio', e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Resultado</label>
              <input
                type="text"
                value={form.resultado ?? ''}
                onChange={(e) => setFormField('resultado', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </section>

        {/* 3. Sobre o projeto */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Sobre o projeto</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Descrição *</label>
            <textarea
              value={form.descricao ?? ''}
              onChange={(e) => setFormField('descricao', e.target.value)}
              rows={6}
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </section>

        {/* 4. O que foi feito */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">O que foi feito</h2>
          <div className="space-y-2">
            {oQueFoiFeitoList.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setOQueFoiFeitoItem(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button type="button" onClick={() => removeOQueFoiFeito(i)} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOQueFoiFeito}
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <Plus className="h-4 w-4" /> Adicionar item
            </button>
          </div>
        </section>

        {/* 5. Imagens */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Imagens</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Imagem principal</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onMainImage} className="mt-1 text-sm text-slate-600" />
              {imagemPrincipal && (
                <img src={imagemPrincipal} alt="Preview" className="mt-2 max-h-48 rounded-lg border border-[var(--border)] object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Imagens adicionais (até 10)</label>
              <input ref={addImagesRef} type="file" accept="image/*" multiple onChange={onAddImages} className="mt-1 text-sm text-slate-600" />
              <div className="mt-2 flex flex-wrap gap-2">
                {imagensAdicionais.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg border border-[var(--border)] object-cover" />
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
          </div>
        </section>

        {/* 6. CTAs e publicação */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">CTAs e publicação</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Texto do botão principal</label>
              <input
                type="text"
                value={form.ctaTexto ?? ''}
                onChange={(e) => setFormField('ctaTexto', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Texto do link secundário</label>
              <input
                type="text"
                value={form.ctaLinkTexto ?? ''}
                onChange={(e) => setFormField('ctaLinkTexto', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ordem</label>
              <input
                type="number"
                value={form.ordem ?? 0}
                onChange={(e) => setFormField('ordem', e.target.value ? Number(e.target.value) : 0)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Cliente relacionado</label>
              <select
                value={form.clienteRef ?? ''}
                onChange={(e) => setFormField('clienteRef', e.target.value || undefined)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="">— Nenhum</option>
                {clientes.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}{c.nomeEmpresa ? ` (${c.nomeEmpresa})` : ''}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.publicado ?? false}
                onChange={(e) => setFormField('publicado', e.target.checked)}
                className="rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-slate-700">Publicado</span>
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Link href="/posts" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
