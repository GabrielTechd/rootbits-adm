'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MessageModal } from '@/components/MessageModal';
import { UserAvatarNome } from '@/components/UserAvatarNome';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function PerfilPage() {
  const { usuario, updateProfile } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario?.nome) setNome(usuario.nome);
  }, [usuario?.nome]);
  const [msg, setMsg] = useState<{ open: boolean; title: string; message: string; variant: 'error' | 'success' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const iniciais = usuario?.nome?.trim()
    ? usuario.nome.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const handleSalvarNome = async () => {
    if (!nome.trim() || nome === usuario?.nome) return;
    setSaving(true);
    try {
      await updateProfile({ nome: nome.trim() });
      setMsg({ open: true, title: 'Sucesso', message: 'Nome atualizado.', variant: 'success' });
    } catch (e) {
      setMsg({
        open: true,
        title: 'Erro',
        message: e instanceof Error ? e.message : 'Erro ao atualizar nome',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const avatar = await fileToDataUrl(file);
      await updateProfile({ avatar });
      setMsg({ open: true, title: 'Sucesso', message: 'Foto de perfil atualizada.', variant: 'success' });
    } catch (err) {
      setMsg({
        open: true,
        title: 'Erro',
        message: err instanceof Error ? err.message : 'Erro ao enviar foto',
        variant: 'error',
      });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleRemoverFoto = async () => {
    if (!usuario?.avatar) return;
    setSaving(true);
    try {
      await updateProfile({ avatar: null });
      setMsg({ open: true, title: 'Sucesso', message: 'Foto removida.', variant: 'success' });
    } catch (err) {
      setMsg({
        open: true,
        title: 'Erro',
        message: err instanceof Error ? err.message : 'Erro ao remover foto',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Meu perfil</h1>
        <UserAvatarNome nome={usuario.nome} avatar={usuario.avatar} size="md" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Foto de perfil</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            {usuario.avatar ? (
              <img
                src={usuario.avatar}
                alt={usuario.nome}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600 ring-2 ring-slate-200 shadow-md">
                {iniciais || <User className="h-12 w-12" />}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" /> Nova foto
              </button>
              {usuario.avatar && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> Remover
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Formatos aceitos: JPG, PNG, GIF. A foto aparece no menu lateral e na sua identificação.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Dados pessoais</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">E-mail</label>
            <p className="mt-1 text-slate-600">{usuario.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">O e-mail não pode ser alterado aqui.</p>
          </div>
          <button
            type="button"
            onClick={handleSalvarNome}
            disabled={saving || nome.trim() === usuario.nome}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar nome'}
          </button>
        </div>
      </div>

      <MessageModal
        open={msg.open}
        title={msg.title}
        message={msg.message}
        variant={msg.variant}
        onClose={() => setMsg((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}
