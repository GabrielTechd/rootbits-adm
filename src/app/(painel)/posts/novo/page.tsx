'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { posts as apiPosts, clientes as apiClientes, fileToDataUrl, type Post, type Cliente } from '@/lib/api';

const TOTAL_ETAPAS = 6;

function normalizarClientes(c: unknown): Cliente[] {
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object' && 'dados' in c && Array.isArray((c as { dados: Cliente[] }).dados)) return (c as { dados: Cliente[] }).dados;
  return [];
}

const emptyForm: Partial<Post> = {
  titulo: '',
  subtitulo: '',
  descricao: '',
  tags: [],
  desafio: '',
  resultado: '',
  oQueFoiFeito: [],
  ctaTexto: 'Quero um resultado como esse',
  ctaLinkTexto: 'Ver outros projetos',
  publicado: true,
  ordem: 0,
  clienteRef: undefined,
};

export default function NovoPostPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [form, setForm] = useState<Partial<Post>>(emptyForm);
  const [imagemPrincipal, setImagemPrincipal] = useState('');
  const [imagensAdicionais, setImagensAdicionais] = useState<string[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImagesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClientes.list().then((r) => setClientes(normalizarClientes(r))).catch(() => setClientes([]));
  }, []);

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

  const canProximoEtapa1 = () => !!form.titulo?.trim();
  const submit = async () => {
    setError('');
    if (!form.titulo?.trim()) {
      setError('Título é obrigatório.');
      return;
    }
    if (!imagemPrincipal) {
      setError('Imagem principal é obrigatória.');
      return;
    }
    setSaving(true);
    try {
      await apiPosts.create({
        ...form,
        titulo: form.titulo!,
        descricao: form.descricao || undefined,
        imagemPrincipal,
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

  const goNext = () => {
    setError('');
    if (etapa === 1 && !canProximoEtapa1()) {
      setError('Preencha o título para continuar.');
      return;
    }
    if (etapa === TOTAL_ETAPAS) {
      submit();
      return;
    }
    setEtapa((e) => e + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-slate-800">Novo estudo de caso</h1>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              n === etapa ? 'bg-[var(--primary)] text-white' : n < etapa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

        {/* Etapa 1: Cabeçalho */}
        {etapa === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Cabeçalho do caso</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Título *</label>
              <input
                type="text"
                value={form.titulo ?? ''}
                onChange={(e) => setFormField('titulo', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Ex.: E-commerce de moda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Subtítulo</label>
              <input
                type="text"
                value={form.subtitulo ?? ''}
                onChange={(e) => setFormField('subtitulo', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Ex.: Marca de roupas"
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
          </section>
        )}

        {/* Etapa 2: Desafio e resultado */}
        {etapa === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Desafio e resultado</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Desafio</label>
              <textarea
                value={form.desafio ?? ''}
                onChange={(e) => setFormField('desafio', e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Ex.: Aumentar conversão e experiência mobile."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Resultado</label>
              <input
                type="text"
                value={form.resultado ?? ''}
                onChange={(e) => setFormField('resultado', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Ex.: +40% em vendas online no primeiro trimestre."
              />
            </div>
          </section>
        )}

        {/* Etapa 3: Sobre o projeto */}
        {etapa === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Sobre o projeto</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Descrição *</label>
              <textarea
                value={form.descricao ?? ''}
                onChange={(e) => setFormField('descricao', e.target.value)}
                rows={6}
                className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Parágrafo descrevendo o projeto..."
              />
            </div>
          </section>
        )}

        {/* Etapa 4: O que foi feito */}
        {etapa === 4 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">O que foi feito</h2>
            <p className="text-sm text-slate-500">Lista de itens (ex.: Redesign da vitrine, Checkout simplificado...)</p>
            <div className="space-y-2">
              {oQueFoiFeitoList.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => setOQueFoiFeitoItem(i, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="Item da lista"
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
        )}

        {/* Etapa 5: Imagens */}
        {etapa === 5 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Imagens</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Imagem principal *</label>
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
          </section>
        )}

        {/* Etapa 6: CTAs e publicação */}
        {etapa === 6 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">CTAs e publicação</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Texto do botão principal</label>
              <input
                type="text"
                value={form.ctaTexto ?? ''}
                onChange={(e) => setFormField('ctaTexto', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Quero um resultado como esse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Texto do link secundário</label>
              <input
                type="text"
                value={form.ctaLinkTexto ?? ''}
                onChange={(e) => setFormField('ctaLinkTexto', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="Ver outros projetos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ordem (maior = primeiro na listagem)</label>
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
                checked={form.publicado ?? true}
                onChange={(e) => setFormField('publicado', e.target.checked)}
                className="rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-slate-700">Publicado</span>
            </label>
          </section>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {etapa > 1 && (
            <button
              type="button"
              onClick={() => { setEtapa((e) => e - 1); setError(''); }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {etapa === TOTAL_ETAPAS ? (saving ? 'Criando...' : 'Criar estudo de caso') : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
