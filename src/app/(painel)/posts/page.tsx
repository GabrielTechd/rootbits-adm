'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { posts as apiPosts, type Post } from '@/lib/api';

export default function PostsPage() {
  const { can } = useAuth();
  const [list, setList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este post?')) return;
    try {
      await apiPosts.delete(id);
      const r = await apiPosts.list();
      setList(normalizarLista(r));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir');
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
            <Plus className="h-4 w-4" /> Novo post
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
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <div
                key={post._id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-white transition-shadow hover:shadow-md"
              >
                <div className="aspect-video bg-slate-100">
                  {post.imagemPrincipal ? (
                    <img
                      src={post.imagemPrincipal}
                      alt={post.titulo}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 line-clamp-1">{post.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{post.descricao}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={`/posts/${post._id}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post._id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
