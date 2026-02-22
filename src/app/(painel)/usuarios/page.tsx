'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/PasswordInput';
import { usuarios as apiUsuarios, type Usuario, type Role } from '@/lib/api';

const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

export default function UsuariosPage() {
  const { can, usuario: usuarioLogado } = useAuth();
  const [list, setList] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; usuario?: Usuario }>({ open: false });
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean; usuario: Usuario | null }>({ open: false, usuario: null });
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'suporte' as Role, ativo: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = can(['admin', 'ceo']);
  const canDelete = can(['admin', 'ceo']);

  // Fallback caso a API não retorne roles ou retorne em formato diferente
  const ROLES_FALLBACK: string[] = ['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte'];

  // API retorna { dados: Usuario[], total, page, limit }; aceita também array ou { usuarios } por compatibilidade
  const normalizarLista = (u: unknown): Usuario[] => {
    if (Array.isArray(u)) return u;
    if (u && typeof u === 'object') {
      if ('dados' in u && Array.isArray((u as { dados: Usuario[] }).dados)) return (u as { dados: Usuario[] }).dados;
      if ('usuarios' in u && Array.isArray((u as { usuarios: Usuario[] }).usuarios)) return (u as { usuarios: Usuario[] }).usuarios;
    }
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [u, r] = await Promise.all([apiUsuarios.list(), apiUsuarios.roles()]);
        setList(normalizarLista(u));

        // API pode retornar array direto ou objeto { roles: string[] }
        let roleList: string[] = [];
        if (Array.isArray(r)) {
          roleList = r;
        } else if (r && typeof r === 'object' && 'roles' in r && Array.isArray((r as { roles: string[] }).roles)) {
          roleList = (r as { roles: string[] }).roles;
        }
        setRoles(roleList.length > 0 ? roleList : ROLES_FALLBACK);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar');
        setRoles(ROLES_FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCreate = () => {
    setForm({ nome: '', email: '', senha: '', role: 'suporte', ativo: true });
    setModal({ open: true });
    setError('');
  };

  const openEdit = (u: Usuario) => {
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      role: u.role,
      ativo: u.ativo ?? true,
    });
    setModal({ open: true, usuario: u });
    setError('');
  };

  const openExcluir = (u: Usuario) => {
    setModalExcluir({ open: true, usuario: u });
    setConfirmacaoExcluir('');
    setError('');
  };

  const closeExcluir = () => {
    setModalExcluir({ open: false, usuario: null });
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!modalExcluir.usuario || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setError('');
    try {
      await apiUsuarios.delete(modalExcluir.usuario._id);
      const u = await apiUsuarios.list();
      setList(normalizarLista(u));
      closeExcluir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (modal.usuario) {
        await apiUsuarios.update(modal.usuario._id, {
          nome: form.nome,
          email: form.email,
          role: form.role,
          ativo: form.ativo,
          ...(form.senha ? { senha: form.senha } : {}),
        });
      } else {
        if (!form.senha) throw new Error('Senha é obrigatória');
        await apiUsuarios.create({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          role: form.role,
          ativo: form.ativo,
        });
      }
      const u = await apiUsuarios.list();
      setList(normalizarLista(u));
      setModal({ open: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Você não tem permissão para gerenciar usuários.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
        >
          <Plus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-700">Nome</th>
                  <th className="px-6 py-4 font-medium text-slate-700">E-mail</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Cargo</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-4 font-medium text-slate-700 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id} className="border-b border-[var(--border)] hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <UserCircle className="h-9 w-9 text-slate-400" />
                        )}
                        <span className="font-medium text-slate-800">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={u.ativo ? 'text-emerald-600' : 'text-slate-400'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete && usuarioLogado?._id !== u._id && (
                          <button
                            type="button"
                            onClick={() => openExcluir(u)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">
              {modal.usuario ? 'Editar usuário' : 'Novo usuário'}
            </h2>
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={!!modal.usuario}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 disabled:bg-slate-50 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Senha {modal.usuario && '(deixe em branco para não alterar)'}
                </label>
                <PasswordInput
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Cargo</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-slate-700">Ativo</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal({ open: false })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExcluir.open && modalExcluir.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir usuário</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir <strong>{modalExcluir.usuario.nome}</strong> ({modalExcluir.usuario.email})? Esta ação não pode ser desfeita.
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
