'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clientes as apiClientes, usuarios as apiUsuarios, type Cliente, type Usuario } from '@/lib/api';

function normalizarLista(c: unknown): Cliente[] {
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object') {
    if ('dados' in c && Array.isArray((c as { dados: Cliente[] }).dados)) return (c as { dados: Cliente[] }).dados;
    if ('clientes' in c && Array.isArray((c as { clientes: Cliente[] }).clientes)) return (c as { clientes: Cliente[] }).clientes;
  }
  return [];
}

function normalizarOpcoes(res: unknown, key: string): string[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && key in res && Array.isArray((res as Record<string, string[]>)[key])) {
    return (res as Record<string, string[]>)[key];
  }
  return [];
}

const emptyForm: Partial<Cliente> = {
  nome: '',
  email: '',
  telefone: '',
  telefone2: '',
  celular: '',
  whatsapp: '',
  cargo: '',
  nomeEmpresa: '',
  razaoSocial: '',
  cnpj: '',
  ramoAtividade: '',
  tipoSite: '',
  preco: undefined,
  precoPago: undefined,
  valorEntrada: undefined,
  valorParcelas: undefined,
  formaPagamento: '',
  quantidadeParcelas: undefined,
  status: '',
  etapa: '',
  probabilidade: undefined,
  origemLead: '',
  dataProposta: '',
  dataFechamento: '',
  dataEntregaPrevista: '',
  dataPrimeiroContato: '',
  dataContrato: '',
  urlSite: '',
  dominio: '',
  hospedagem: '',
  vendedor: undefined,
  responsavel: undefined,
  endereco: undefined,
  observacoes: '',
  observacoesInternas: '',
};

const STATUS_FALLBACK = ['prospect', 'proposta_enviada', 'negociacao', 'fechado', 'perdido', 'ativo', 'encerrado', 'inativo'];
const FORMAS_FALLBACK = ['a_vista', 'parcelado_2x', 'parcelado_3x', 'parcelado_6x', 'parcelado_12x', 'mensalidade', 'combinado', 'outro'];
const ORIGENS_FALLBACK = ['indicacao', 'google', 'instagram', 'facebook', 'linkedin', 'site', 'whatsapp', 'telefone', 'email', 'evento', 'outro'];
const CONFIRMAR_EXCLUSAO = 'EXCLUIR';

export default function ClientesPage() {
  const { can } = useAuth();
  const [list, setList] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiposSite, setTiposSite] = useState<string[]>([]);
  const [statusVenda, setStatusVenda] = useState<string[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [origensLead, setOrigensLead] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState({ busca: '', status: '', tipoSite: '', origemLead: '' });
  const [modal, setModal] = useState<{ open: boolean; cliente?: Cliente }>({ open: false });
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null });
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const TOTAL_ETAPAS = 5;
  const [form, setForm] = useState<Partial<Cliente>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canDelete = can(['admin', 'ceo']);
  const canEdit = can(['admin', 'ceo', 'programador', 'vendedor']);
  const isNovoCliente = modal.open && !modal.cliente;

  useEffect(() => {
    const load = async () => {
      try {
        const [c, t, st, f, o, u] = await Promise.all([
          apiClientes.list(),
          apiClientes.tiposSite(),
          apiClientes.statusVenda(),
          apiClientes.formasPagamento(),
          apiClientes.origensLead(),
          canEdit ? apiUsuarios.list() : Promise.resolve({ dados: [] as Usuario[] }),
        ]);
        setList(normalizarLista(c));
        const tiposList = normalizarOpcoes(t, 'tipos').length > 0 ? normalizarOpcoes(t, 'tipos') : (normalizarOpcoes(t, 'tiposSite').length > 0 ? normalizarOpcoes(t, 'tiposSite') : normalizarOpcoes(t, 'dados'));
        setTiposSite(tiposList.length > 0 ? tiposList : ['landing', 'institucional', 'ecommerce', 'blog', 'sistema', 'app', 'outro']);
        setStatusVenda(normalizarOpcoes(st, 'status').length > 0 ? normalizarOpcoes(st, 'status') : STATUS_FALLBACK);
        setFormasPagamento(normalizarOpcoes(f, 'formas').length > 0 ? normalizarOpcoes(f, 'formas') : FORMAS_FALLBACK);
        setOrigensLead(normalizarOpcoes(o, 'origens').length > 0 ? normalizarOpcoes(o, 'origens') : ORIGENS_FALLBACK);
        const usuList = typeof u === 'object' && u && 'dados' in u && Array.isArray((u as { dados: Usuario[] }).dados) ? (u as { dados: Usuario[] }).dados : (Array.isArray(u) ? u : []);
        setUsuarios(usuList);
      } catch {
        setList([]);
        setStatusVenda(STATUS_FALLBACK);
        setFormasPagamento(FORMAS_FALLBACK);
        setOrigensLead(ORIGENS_FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canEdit]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filtro.busca) params.busca = filtro.busca;
        if (filtro.status) params.status = filtro.status;
        if (filtro.tipoSite) params.tipoSite = filtro.tipoSite;
        if (filtro.origemLead) params.origemLead = filtro.origemLead;
        const c = await apiClientes.list(params);
        setList(normalizarLista(c));
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtro.busca, filtro.status, filtro.tipoSite, filtro.origemLead]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEtapa(1);
    setModal({ open: true });
    setError('');
  };

  const openEdit = async (cliente: Cliente) => {
    try {
      const c = await apiClientes.get(cliente._id);
      const vendedorId = typeof c.vendedor === 'object' && c.vendedor && '_id' in c.vendedor ? (c.vendedor as Usuario)._id : (c.vendedor as string) || '';
      const responsavelId = typeof c.responsavel === 'object' && c.responsavel && '_id' in c.responsavel ? (c.responsavel as Usuario)._id : (c.responsavel as string) || '';
      setForm({
        ...c,
        vendedor: vendedorId,
        responsavel: responsavelId,
      });
      setModal({ open: true, cliente: c });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (modal.cliente) {
        await apiClientes.update(modal.cliente._id, payload);
      } else {
        await apiClientes.create(payload);
      }
      const c = await apiClientes.list();
      setList(normalizarLista(c));
      setModal({ open: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const openExcluir = (cliente: Cliente) => {
    setModalExcluir({ open: true, cliente });
    setConfirmacaoExcluir('');
    setError('');
  };

  const closeExcluir = () => {
    setModalExcluir({ open: false, cliente: null });
    setConfirmacaoExcluir('');
  };

  const handleExcluir = async () => {
    if (!modalExcluir.cliente || confirmacaoExcluir !== CONFIRMAR_EXCLUSAO) return;
    setExcluindo(true);
    setError('');
    try {
      await apiClientes.delete(modalExcluir.cliente._id);
      setList((prev) => prev.filter((c) => c._id !== modalExcluir.cliente!._id));
      closeExcluir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  const setFormField = <K extends keyof Cliente>(key: K, value: Cliente[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setEndereco = (key: string, value: string) => setForm((f) => ({ ...f, endereco: { ...(f.endereco || {}), [key]: value } }));

  const formatStatus = (s: string) => s?.replace(/_/g, ' ') || '—';
  const formatMoney = (n: number | undefined) => (n != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n) : '—');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <input
          type="search"
          placeholder="Buscar (nome, email, empresa, CNPJ)..."
          value={filtro.busca}
          onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
        <select
          value={filtro.status}
          onChange={(e) => setFiltro((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">Todos os status</option>
          {statusVenda.map((s) => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
        <select
          value={filtro.tipoSite}
          onChange={(e) => setFiltro((f) => ({ ...f, tipoSite: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">Todos os tipos de site</option>
          {tiposSite.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filtro.origemLead}
          onChange={(e) => setFiltro((f) => ({ ...f, origemLead: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">Todas as origens</option>
          {origensLead.map((o) => (
            <option key={o} value={o}>{formatStatus(o)}</option>
          ))}
        </select>
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
                  <th className="px-6 py-4 font-medium text-slate-700">Contato / Empresa</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Tipo</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Valor</th>
                  <th className="px-6 py-4 font-medium text-slate-700">Origem</th>
                  {canEdit && <th className="px-6 py-4 font-medium text-slate-700 w-24">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b border-[var(--border)] hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{c.nome}</p>
                          {c.nomeEmpresa && <p className="text-slate-500">{c.nomeEmpresa}</p>}
                          {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                        {formatStatus(c.status ?? '') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.tipoSite || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{formatMoney(c.preco)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatStatus(c.origemLead ?? '') || '—'}</td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {canDelete && (
                            <button type="button" onClick={() => openExcluir(c)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="py-12 text-center text-slate-500">Nenhum cliente encontrado.</div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">{modal.cliente ? 'Editar cliente' : 'Novo cliente'}</h2>

            {isNovoCliente && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
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
            )}

            {error && <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

            <div className="mt-4 space-y-6">
              {/* Etapa 1: Contato */}
              {(isNovoCliente ? etapa === 1 : true) && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Contato</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Nome *</label>
                    <input type="text" value={form.nome ?? ''} onChange={(e) => setFormField('nome', e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">E-mail *</label>
                    <input type="email" value={form.email ?? ''} onChange={(e) => setFormField('email', e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Telefone</label>
                    <input type="text" value={form.telefone ?? ''} onChange={(e) => setFormField('telefone', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Celular</label>
                    <input type="text" value={form.celular ?? ''} onChange={(e) => setFormField('celular', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
                    <input type="text" value={form.whatsapp ?? ''} onChange={(e) => setFormField('whatsapp', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cargo</label>
                    <input type="text" value={form.cargo ?? ''} onChange={(e) => setFormField('cargo', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>
              )}

              {/* Etapa 2: Empresa */}
              {(isNovoCliente ? etapa === 2 : true) && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Empresa</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nome fantasia</label>
                    <input type="text" value={form.nomeEmpresa ?? ''} onChange={(e) => setFormField('nomeEmpresa', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Razão social</label>
                    <input type="text" value={form.razaoSocial ?? ''} onChange={(e) => setFormField('razaoSocial', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">CNPJ</label>
                    <input type="text" value={form.cnpj ?? ''} onChange={(e) => setFormField('cnpj', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ramo de atuação</label>
                    <input type="text" value={form.ramoAtividade ?? ''} onChange={(e) => setFormField('ramoAtividade', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>
              )}

              {/* Etapa 3: Venda / Proposta */}
              {(isNovoCliente ? etapa === 3 : true) && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Venda / Proposta</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Tipo de site</label>
                    <select value={form.tipoSite ?? ''} onChange={(e) => setFormField('tipoSite', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {tiposSite.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select value={form.status ?? ''} onChange={(e) => setFormField('status', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {statusVenda.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Origem do lead</label>
                    <select value={form.origemLead ?? ''} onChange={(e) => setFormField('origemLead', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {origensLead.map((o) => <option key={o} value={o}>{formatStatus(o)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Forma de pagamento</label>
                    <select value={form.formaPagamento ?? ''} onChange={(e) => setFormField('formaPagamento', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {formasPagamento.map((f) => <option key={f} value={f}>{formatStatus(f)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Valor total (R$)</label>
                    <input type="number" min={0} step={0.01} value={form.preco ?? ''} onChange={(e) => setFormField('preco', e.target.value ? Number(e.target.value) : undefined)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Valor pago (R$)</label>
                    <input type="number" min={0} step={0.01} value={form.precoPago ?? ''} onChange={(e) => setFormField('precoPago', e.target.value ? Number(e.target.value) : undefined)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Etapa</label>
                    <input type="text" value={form.etapa ?? ''} onChange={(e) => setFormField('etapa', e.target.value)} placeholder="Ex.: Aguardando retorno" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Probabilidade (%)</label>
                    <input type="number" min={0} max={100} value={form.probabilidade ?? ''} onChange={(e) => setFormField('probabilidade', e.target.value ? Number(e.target.value) : undefined)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Data proposta</label>
                    <input type="date" value={form.dataProposta ?? ''} onChange={(e) => setFormField('dataProposta', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Previsão de entrega</label>
                    <input type="date" value={form.dataEntregaPrevista ?? ''} onChange={(e) => setFormField('dataEntregaPrevista', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>
              )}

              {/* Etapa 4: Projeto e Equipe */}
              {(isNovoCliente ? etapa === 4 : true) && (
              <>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Projeto / Site</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">URL do site atual</label>
                    <input type="text" value={form.urlSite ?? ''} onChange={(e) => setFormField('urlSite', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Domínio desejado</label>
                    <input type="text" value={form.dominio ?? ''} onChange={(e) => setFormField('dominio', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Hospedagem</label>
                    <input type="text" value={form.hospedagem ?? ''} onChange={(e) => setFormField('hospedagem', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Equipe</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Vendedor</label>
                    <select value={typeof form.vendedor === 'string' ? form.vendedor : ''} onChange={(e) => setFormField('vendedor', e.target.value || undefined)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {usuarios.map((u) => <option key={u._id} value={u._id}>{u.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Responsável</label>
                    <select value={typeof form.responsavel === 'string' ? form.responsavel : ''} onChange={(e) => setFormField('responsavel', e.target.value || undefined)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                      <option value="">—</option>
                      {usuarios.map((u) => <option key={u._id} value={u._id}>{u.nome}</option>)}
                    </select>
                  </div>
                </div>
              </section>
              </>
              )}

              {/* Etapa 5: Endereço e Observações */}
              {(isNovoCliente ? etapa === 5 : true) && (
              <>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Endereço</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Logradouro</label>
                    <input type="text" value={form.endereco?.logradouro ?? ''} onChange={(e) => setEndereco('logradouro', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Número</label>
                    <input type="text" value={form.endereco?.numero ?? ''} onChange={(e) => setEndereco('numero', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Complemento</label>
                    <input type="text" value={form.endereco?.complemento ?? ''} onChange={(e) => setEndereco('complemento', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Bairro</label>
                    <input type="text" value={form.endereco?.bairro ?? ''} onChange={(e) => setEndereco('bairro', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cidade</label>
                    <input type="text" value={form.endereco?.cidade ?? ''} onChange={(e) => setEndereco('cidade', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Estado</label>
                    <input type="text" value={form.endereco?.estado ?? ''} onChange={(e) => setEndereco('estado', e.target.value)} placeholder="UF" maxLength={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">CEP</label>
                    <input type="text" value={form.endereco?.cep ?? ''} onChange={(e) => setEndereco('cep', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>

              {/* Observações */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Observações</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Observações (visível ao cliente)</label>
                    <textarea value={form.observacoes ?? ''} onChange={(e) => setFormField('observacoes', e.target.value)} rows={2} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Observações internas</label>
                    <textarea value={form.observacoesInternas ?? ''} onChange={(e) => setFormField('observacoesInternas', e.target.value)} rows={2} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
                  </div>
                </div>
              </section>
              </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {isNovoCliente ? (
                <>
                  <button type="button" onClick={() => setModal({ open: false })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                  </button>
                  {etapa > 1 && (
                    <button type="button" onClick={() => { setEtapa((e) => e - 1); setError(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Anterior
                    </button>
                  )}
                  {etapa < TOTAL_ETAPAS ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (etapa === 1 && (!form.nome?.trim() || !form.email?.trim())) {
                          setError('Preencha nome e e-mail para continuar.');
                          return;
                        }
                        setError('');
                        setEtapa((e) => e + 1);
                      }}
                      className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                    >
                      Próximo
                    </button>
                  ) : (
                    <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60">
                      {saving ? 'Salvando...' : 'Criar cliente'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setModal({ open: false })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                  <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {modalExcluir.open && modalExcluir.cliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Excluir cliente</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir <strong>{modalExcluir.cliente.nome}</strong>
              {modalExcluir.cliente.nomeEmpresa && <> ({modalExcluir.cliente.nomeEmpresa})</>}? Esta ação não pode ser desfeita.
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
