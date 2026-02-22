const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    throw new Error('Não autorizado');
  }
  if (res.status === 403) throw new Error('Sem permissão para esta ação');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? err.erro ?? `Erro ${res.status}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  return res.json();
}

// Auth
export const auth = {
  login: (email: string, senha: string) =>
    api<{ token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  me: () => api<Usuario>('/auth/me'),
  updateMe: (data: { nome?: string; avatar?: string | null }) =>
    api<Usuario>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
};

// Usuários — API retorna { dados: Usuario[], total, page, limit }
export const usuarios = {
  list: (params?: { role?: string; ativo?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.ativo !== undefined) q.set('ativo', String(params.ativo));
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString();
    return api<{ dados: Usuario[]; total: number; page?: number; limit?: number }>(`/usuarios${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<Usuario>(`/usuarios/${id}`),
  create: (data: Partial<Usuario> & { senha: string }) =>
    api<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Usuario>) =>
    api<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/usuarios/${id}`, { method: 'DELETE' }),
  roles: () => api<string[] | { roles: string[] }>('/usuarios/roles'),
};

// Posts — API retorna { dados: Post[], total, page, limit }
export const posts = {
  list: (params?: { publicado?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.publicado !== undefined) q.set('publicado', String(params.publicado));
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString();
    return api<{ dados: Post[]; total: number; page?: number; limit?: number }>(`/posts${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<Post>(`/posts/${id}`),
  create: (data: Partial<Post> & { imagemPrincipal: string }) =>
    api<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Post>) =>
    api<Post>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/posts/${id}`, { method: 'DELETE' }),
};

// Clientes — list retorna { dados, total, page, limit }
export const clientes = {
  list: (params?: { status?: string; tipoSite?: string; vendedor?: string; origemLead?: string; busca?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.tipoSite) q.set('tipoSite', params.tipoSite);
    if (params?.vendedor) q.set('vendedor', params.vendedor);
    if (params?.origemLead) q.set('origemLead', params.origemLead);
    if (params?.busca) q.set('busca', params.busca);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString();
    return api<{ dados: Cliente[]; total: number; page?: number; limit?: number }>(`/clientes${query ? `?${query}` : ''}`);
  },
  tiposSite: () => api<string[] | { tipos?: string[]; tiposSite?: string[]; dados?: string[] }>('/clientes/tipos-site'),
  statusVenda: () => api<string[] | { status?: string[] }>('/clientes/status-venda'),
  formasPagamento: () => api<string[] | { formas?: string[] }>('/clientes/formas-pagamento'),
  origensLead: () => api<string[] | { origens?: string[] }>('/clientes/origens-lead'),
  get: (id: string) => api<Cliente>(`/clientes/${id}`),
  create: (data: Partial<Cliente>) =>
    api<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Cliente>) =>
    api<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/clientes/${id}`, { method: 'DELETE' }),
};

// Chamados
export const chamados = {
  list: (params?: { status?: string; cliente?: string; responsavel?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<{ chamados: Chamado[]; total?: number }>(`/chamados${q ? `?${q}` : ''}`);
  },
  status: () => api<string[]>('/chamados/status'),
  prioridades: () => api<string[]>('/chamados/prioridades'),
  get: (id: string) => api<Chamado>(`/chamados/${id}`),
  create: (data: Partial<Chamado> & { cliente: string }) =>
    api<Chamado>('/chamados', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Chamado>) =>
    api<Chamado>(`/chamados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  comentario: (id: string, texto: string) =>
    api<Chamado>(`/chamados/${id}/comentarios`, { method: 'POST', body: JSON.stringify({ texto }) }),
};

// Contatos
export const contatos = {
  list: (params?: { lido?: boolean }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<Contato[]>(`/contatos${q ? `?${q}` : ''}`);
  },
  unreadCount: () => api<{ count: number }>('/contatos/unread-count'),
  get: (id: string) => api<Contato>(`/contatos/${id}`),
  marcarLido: (id: string) =>
    api<void>(`/contatos/${id}/marcar-lido`, { method: 'PUT' }),
  marcarTodosLidos: () =>
    api<void>('/contatos/marcar-todos-lidos', { method: 'PUT' }),
  update: (id: string, data: Partial<Contato>) =>
    api<Contato>(`/contatos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Notificações — API pode retornar array ou { dados: Notificacao[] }
export const notificacoes = {
  list: (params?: { lida?: boolean }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<Notificacao[] | { dados: Notificacao[] }>(`/notificacoes${q ? `?${q}` : ''}`);
  },
  unreadCount: () => api<{ count: number }>('/notificacoes/unread-count'),
  marcarLida: (id: string) =>
    api<void>(`/notificacoes/${id}/marcar-lida`, { method: 'PUT' }),
  marcarTodasLidas: () =>
    api<void>('/notificacoes/marcar-todas-lidas', { method: 'PUT' }),
};

// Types
export type Role = 'admin' | 'ceo' | 'programador' | 'designer' | 'vendedor' | 'suporte';

export interface Usuario {
  _id: string;
  nome: string;
  email: string;
  role: Role;
  ativo?: boolean;
  /** Data URL (ex.: data:image/jpeg;base64,...) ou null quando sem foto */
  avatar?: string | null;
}

export interface Post {
  _id: string;
  titulo: string;
  descricao?: string;
  imagemPrincipal?: string;
  imagensAdicionais?: string[];
  publicado?: boolean;
  ordem?: number;
  tags?: string[];
  clienteRef?: string;
  createdAt?: string;
}

export interface EnderecoCliente {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Cliente {
  _id: string;
  nome: string;
  email?: string;
  telefone?: string;
  telefone2?: string;
  celular?: string;
  whatsapp?: string;
  cargo?: string;
  nomeEmpresa?: string;
  razaoSocial?: string;
  cnpj?: string;
  ramoAtividade?: string;
  tipoSite?: string;
  preco?: number;
  precoPago?: number;
  valorEntrada?: number;
  valorParcelas?: number;
  formaPagamento?: string;
  quantidadeParcelas?: number;
  status?: string;
  etapa?: string;
  probabilidade?: number;
  origemLead?: string;
  dataProposta?: string;
  dataFechamento?: string;
  dataEntregaPrevista?: string;
  dataPrimeiroContato?: string;
  dataContrato?: string;
  urlSite?: string;
  dominio?: string;
  hospedagem?: string;
  vendedor?: string | Usuario;
  responsavel?: string | Usuario;
  endereco?: EnderecoCliente;
  informacoesAdicionais?: string;
  observacoes?: string;
  observacoesInternas?: string;
  createdAt?: string;
}

export interface Chamado {
  _id: string;
  titulo: string;
  descricao?: string;
  status: string;
  prioridade?: string;
  cliente: string | Cliente;
  responsavel?: string | Usuario;
  anexos?: { data: string; contentType: string; filename?: string }[];
  comentarios?: { texto: string; autor: string | Usuario; createdAt: string }[];
  createdAt?: string;
}

export interface Contato {
  _id: string;
  nome: string;
  email: string;
  telefone?: string;
  mensagem: string;
  lido?: boolean;
  respondido?: boolean;
  observacao?: string;
  createdAt?: string;
}

export interface Notificacao {
  _id: string;
  titulo: string;
  mensagem?: string;
  link?: string;
  lida?: boolean;
  createdAt?: string;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
