'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileImage, Building2, Headphones, Mail, Bell, ArrowRight, DollarSign, Banknote } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usuarios, posts, clientes, chamados, contatos, notificacoes } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type ClienteResumo = { status?: string; preco?: number; precoPago?: number };

function normalizarLista(c: unknown): ClienteResumo[] {
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object') {
    if ('dados' in c && Array.isArray((c as { dados: unknown[] }).dados)) return (c as { dados: ClienteResumo[] }).dados;
    if ('clientes' in c && Array.isArray((c as { clientes: unknown[] }).clientes)) return (c as { clientes: ClienteResumo[] }).clientes;
    if ('chamados' in c && Array.isArray((c as { chamados: unknown[] }).chamados)) return (c as { chamados: ClienteResumo[] }).chamados;
  }
  return [];
}

const CORES = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

export default function DashboardPage() {
  const { can } = useAuth();
  const [stats, setStats] = useState<{
    usuarios?: number;
    posts?: number;
    clientes?: number;
    chamados?: number;
    contatosNaoLidos?: number;
    notifNaoLidas?: number;
    totalVendas?: number;
    totalRecebido?: number;
  }>({});
  const [clientesPorStatus, setClientesPorStatus] = useState<{ name: string; value: number }[]>([]);
  const [chamadosPorStatus, setChamadosPorStatus] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, p, c, ch, co, n] = await Promise.all([
          can(['admin', 'ceo']) ? usuarios.list() : Promise.resolve([]),
          can(['admin', 'ceo', 'programador', 'designer']) ? posts.list() : Promise.resolve({ dados: [], total: 0 }),
          clientes.list(),
          chamados.list(),
          contatos.unreadCount(),
          notificacoes.unreadCount(),
        ]);

        const listaClientes = normalizarLista(c);
        const listaChamados = normalizarLista(ch);

        const totalUsuarios = typeof u === 'object' && u && 'dados' in u ? (u as { dados: unknown[] }).dados.length : (typeof u === 'object' && u && 'total' in u ? (u as { total: number }).total : (Array.isArray(u) ? u.length : 0));
        const totalPosts = typeof p === 'object' && p && ('dados' in p || 'total' in p) ? ((p as { dados?: unknown[] }).dados?.length ?? (p as { total: number }).total ?? 0) : 0;
        const totalClientes = listaClientes.length;
        const totalChamados = listaChamados.length;

        const totalVendas = listaClientes.reduce((acc, cli) => acc + (Number(cli.preco) || 0), 0);
        const totalRecebido = listaClientes.reduce((acc, cli) => acc + (Number(cli.precoPago) || 0), 0);

        setStats({
          usuarios: totalUsuarios,
          posts: totalPosts,
          clientes: totalClientes,
          chamados: totalChamados,
          contatosNaoLidos: (co as { count?: number })?.count ?? 0,
          notifNaoLidas: (n as { count?: number })?.count ?? 0,
          totalVendas,
          totalRecebido,
        });

        const statusClienteCount: Record<string, number> = {};
        listaClientes.forEach((item) => {
          const s = item.status || 'sem status';
          statusClienteCount[s] = (statusClienteCount[s] || 0) + 1;
        });
        setClientesPorStatus(
          Object.entries(statusClienteCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
        );

        const statusChamadoCount: Record<string, number> = {};
        listaChamados.forEach((item) => {
          const s = item.status || 'sem status';
          statusChamadoCount[s] = (statusChamadoCount[s] || 0) + 1;
        });
        setChamadosPorStatus(
          Object.entries(statusChamadoCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
        );
      } catch {
        setStats({});
        setClientesPorStatus([]);
        setChamadosPorStatus([]);
      }
    };
    load();
  }, [can]);

  const formatBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const cards = [
    can(['admin', 'ceo']) && { label: 'Usuários', value: stats.usuarios ?? 0, href: '/usuarios', icon: Users },
    can(['admin', 'ceo', 'programador', 'designer']) && { label: 'Projetos', value: stats.posts ?? 0, href: '/posts', icon: FileImage },
    { label: 'Clientes', value: stats.clientes ?? 0, href: '/clientes', icon: Building2 },
    { label: 'Chamados', value: stats.chamados ?? 0, href: '/chamados', icon: Headphones },
    { label: 'Contatos não lidos', value: stats.contatosNaoLidos ?? 0, href: '/contatos', icon: Mail },
    { label: 'Notificações não lidas', value: stats.notifNaoLidas ?? 0, href: '/notificacoes', icon: Bell },
  ].filter(Boolean) as { label: string; value: number; href: string; icon: React.ElementType }[];

  const dadosResumo: { nome: string; total: number; link: string }[] = [
    { nome: 'Clientes', total: stats.clientes ?? 0, link: '/clientes' },
    { nome: 'Chamados', total: stats.chamados ?? 0, link: '/chamados' },
    ...(can(['admin', 'ceo', 'programador', 'designer']) ? [{ nome: 'Projetos', total: stats.posts ?? 0, link: '/posts' }] : []),
    ...(can(['admin', 'ceo']) ? [{ nome: 'Usuários', total: stats.usuarios ?? 0, link: '/usuarios' }] : []),
    { nome: 'Contatos (não lidos)', total: stats.contatosNaoLidos ?? 0, link: '/contatos' },
    { nome: 'Notificações (não lidas)', total: stats.notifNaoLidas ?? 0, link: '/notificacoes' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-600">Visão geral do painel</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-sky-50 p-3 text-sky-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300" />
            </Link>
          );
        })}
        <Link
          href="/clientes"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total em vendas (projetos)</p>
              <p className="text-2xl font-bold text-slate-800">{formatBRL(stats.totalVendas ?? 0)}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300" />
        </Link>
        <Link
          href="/clientes"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-teal-50 p-3 text-teal-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Valor recebido</p>
              <p className="text-2xl font-bold text-slate-800">{formatBRL(stats.totalRecebido ?? 0)}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300" />
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Resumo geral</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosResumo} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 12, fill: '#64748b' }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value) => [value ?? 0, 'Total']}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Clientes por status</h2>
          {clientesPorStatus.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientesPorStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {clientesPorStatus.map((_, index) => (
                      <Cell key={index} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value) => [value ?? 0, 'Clientes']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-72 items-center justify-center text-slate-500">Nenhum dado para exibir</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Chamados por status</h2>
          {chamadosPorStatus.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chamadosPorStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {chamadosPorStatus.map((_, index) => (
                      <Cell key={index} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value) => [value ?? 0, 'Chamados']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-72 items-center justify-center text-slate-500">Nenhum dado para exibir</p>
          )}
        </div>
      </div>
    </div>
  );
}
