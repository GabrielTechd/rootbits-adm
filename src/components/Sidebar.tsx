'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileImage,
  Building2,
  Headphones,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { type Role } from '@/lib/api';
import { useState } from 'react';

// Ordem: visão geral → clientes → atendimento → entrada (contatos) → conteúdo → administração
const menuItems: { href: string; label: string; icon: React.ElementType; roles: Role[] }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte'] },
  { href: '/clientes', label: 'Clientes', icon: Building2, roles: ['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte'] },
  { href: '/chamados', label: 'Chamados', icon: Headphones, roles: ['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte'] },
  { href: '/contatos', label: 'Contatos', icon: Mail, roles: ['admin', 'ceo', 'programador', 'designer', 'vendedor', 'suporte'] },
  { href: '/posts', label: 'Projetos / Posts', icon: FileImage, roles: ['admin', 'ceo', 'programador', 'designer'] },
  { href: '/usuarios', label: 'Usuários', icon: Users, roles: ['admin', 'ceo'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout, can } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visible = menuItems.filter((item) => can(item.roles));

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-all duration-200 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--sidebar-border)] px-4">
        {!collapsed && (
          <Link href="/dashboard" className="font-semibold text-slate-800">
            Rootbits Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {visible.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active)]'
                      : 'text-[var(--sidebar-text)] hover:bg-slate-50 hover:text-slate-800'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={`border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {usuario && (
          <div className={`mb-2 shrink-0 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? (
              <p className="truncate text-xs font-medium text-slate-700" title={usuario.nome}>{usuario.nome.split(' ')[0]}</p>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                <span className="text-slate-500">Olá,</span>
                <span className="truncate font-semibold text-slate-800">{usuario.nome}</span>
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="Sair"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
