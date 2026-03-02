'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { posts as apiPosts, type Post } from '@/lib/api';

const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

export default function PostsPage() {
  const { can } = useAuth();
  const [list, setList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean; post: Post | null }>({ open: false, post: null });
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [error, setError] = useState('');
  const canDelete = can(['admin', 'ceo']);
  const canEdit = can(['admin', 'ceo', 'programador', 'designer']);

  // API retorna { dados: Post[] }; aceita também { posts } por compatibilidade
  const normalizarLista = (r: unknown): Post[] => {
    if (!r || typeof r !== 'object') return [];
    if ('dados' in r && Array.isArray((r as { dados: Post[] }).dados)) return (r as { dados: Post[] }).dados;
    if ('posts' in r && Array.isArray((r as { posts: Post[] }).posts)) return (r as { posts: Post[] }).posts;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await apiPosts.list();
        setList(normalizarLista(r));
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openExcluir = (post: Post) => {
    setModalExcluir({ open: true, post });
    setConfirmacaoExcluir('');
    setError('');
  };

  const closeExcluir = () => {
    setModalExcluir({ open: false, post: null });
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!modalExcluir.post || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setError('');
    try {
      await apiPosts.delete(modalExcluir.post._id);
      const r = await apiPosts.list();
      setList(normalizarLista(r));
      closeExcluir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Projetos / Posts</h1>
        {canEdit && (
          <Link
            href="/posts/novo"
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo estudo de caso
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum post cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50/80 text-left text-sm text-slate-600">
                  <th className="w-16 px-4 py-3 font-medium">Imagem</th>
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Descrição</th>
                  <th className="px-6 py-3 font-medium">Publicado</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="w-0 px-4 py-3" aria-label="Ações" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((post) => (
                  <tr key={post._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <Link href={`/posts/${post._id}`} className="block w-12 overflow-hidden rounded bg-slate-100">
                          {post.imagemPrincipal ? (
                            <img src={post.imagemPrincipal} alt="" className="h-12 w-12 object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center text-slate-400">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="block w-12 overflow-hidden rounded bg-slate-100">
                          {post.imagemPrincipal ? (
                            <img src={post.imagemPrincipal} alt="" className="h-12 w-12 object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center text-slate-400">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {canEdit ? (
                        <Link href={`/posts/${post._id}`} className="font-medium text-slate-800 hover:text-[var(--primary)] hover:underline">
                          {post.titulo}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{post.titulo}</span>
                      )}
                    </td>
                    <td className="hidden max-w-[240px] truncate px-6 py-3 text-sm text-slate-500 md:table-cell">
                      {post.descricao || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${post.publicado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {post.publicado ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Link
                            href={`/posts/${post._id}`}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => openExcluir(post)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalExcluir.open && modalExcluir.post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir post</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir o post <strong>{modalExcluir.post.titulo}</strong>? Esta ação não pode ser desfeita.
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
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
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
