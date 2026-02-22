'use client';

import { User } from 'lucide-react';

export type UserAvatarNomeSize = 'sm' | 'md';

type UserAvatarNomeProps = {
  nome: string;
  avatar?: string | null;
  size?: UserAvatarNomeSize;
  /** Texto antes do nome (ex.: "Olá, ") */
  prefix?: string;
  /** Mostrar só o círculo do avatar (ex.: sidebar recolhida) */
  avatarOnly?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: { circle: 'h-8 w-8', text: 'text-sm', icon: 'h-4 w-4' },
  md: { circle: 'h-10 w-10', text: 'text-sm', icon: 'h-5 w-5' },
};

function iniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).map((s) => s[0]).filter(Boolean);
  return parts.slice(0, 2).join('').toUpperCase();
}

export function UserAvatarNome({ nome, avatar, size = 'md', prefix = '', avatarOnly = false, className = '' }: UserAvatarNomeProps) {
  const s = sizeClasses[size];
  const displayNome = nome?.trim() || '—';

  const circle = avatar ? (
    <img
      src={avatar}
      alt={displayNome}
      className={`${s.circle} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`}
    />
  ) : (
    <div
      className={`${s.circle} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white shadow-sm ${s.text}`}
      aria-hidden
    >
      {iniciais(displayNome) || <User className={s.icon} />}
    </div>
  );

  if (avatarOnly) return <div className={className}>{circle}</div>;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {circle}
      <span className={`truncate font-medium text-slate-800 ${s.text}`}>
        {prefix}
        {displayNome}
      </span>
    </div>
  );
}
