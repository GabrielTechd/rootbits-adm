# Rootbits Admin

Painel administrativo da **Rootbits**, com sidebar fixa, tema claro e integração completa à API.

---

## Funcionalidades

- **Login** — Autenticação com e-mail e senha (JWT).
- **Dashboard** — Visão geral com cards, gráfico de barras (resumo) e gráficos de pizza (clientes e chamados por status); totais de vendas e valor recebido (a partir dos clientes).
- **Clientes** — Cadastro por etapas (Contato → Empresa → Venda → Projeto/Equipe → Endereço e observações), listagem com filtros, status e tipos de site vindos da API.
- **Chamados** — Listagem, filtros, criação e detalhe com comentários.
- **Contatos** — Mensagens do site, marcar como lido, filtros.
- **Notificações** — Dropdown no sino do header (sem item no menu); listagem e marcar como lida.
- **Projetos / Posts** — CRUD com imagem principal e adicionais (base64).
- **Usuários** — Listagem, criação e edição (admin/ceo); exclusão com confirmação (digitar "EXCLUIR").

Acesso às telas e ações é controlado por **role** (admin, ceo, programador, designer, vendedor, suporte).

---

## Stack

| Tecnologia        | Uso                    |
|-------------------|------------------------|
| **Next.js 16**    | App Router, React 19   |
| **TypeScript**    | Tipagem                |
| **Tailwind CSS 4**| Estilos                |
| **Lucide React**  | Ícones                 |
| **Recharts**      | Gráficos no dashboard  |

---

## Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **API Rootbits** rodando (ex.: `http://localhost:3030`)

---

## Instalação

```bash
# Clone o repositório (ou já esteja na pasta do projeto)
cd adm

# Instale as dependências
npm install
```

---

## Variáveis de ambiente

Crie um arquivo **`.env`** ou **`.env.local`** na raiz do projeto:

```env
# URL base da API (sem /api no final)
NEXT_PUBLIC_API_BASE=http://localhost:3030/api
```

Se não definir, o padrão é `http://localhost:3000/api`.

---

## Scripts

| Comando         | Descrição                    |
|-----------------|------------------------------|
| `npm run dev`   | Sobe o servidor de desenvolvimento (Next.js) |
| `npm run build` | Gera o build de produção     |
| `npm run start` | Sobe o servidor em modo produção (após `build`) |

---

## Uso

1. Garanta que a **API Rootbits** está no ar e que existe um usuário com perfil permitido (admin, ceo, programador, designer, vendedor ou suporte).
2. Inicie o painel:

   ```bash
   npm run dev
   ```

3. Acesse **http://localhost:3000**.
4. Faça login com e-mail e senha. Você será redirecionado para o **Dashboard**.

---

## Estrutura do projeto (resumo)

```
src/
├── app/
│   ├── (painel)/          # Rotas protegidas (sidebar + header)
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── chamados/
│   │   ├── contatos/
│   │   ├── notificacoes/
│   │   ├── posts/
│   │   └── usuarios/
│   ├── login/
│   ├── layout.tsx
│   ├── page.tsx           # Redireciona para /login ou /dashboard
│   └── globals.css
├── components/
│   ├── Sidebar.tsx        # Menu lateral fixo por role
│   ├── PainelLayout.tsx   # Layout do painel + dropdown de notificações
│   ├── PasswordInput.tsx  # Campo senha com mostrar/ocultar
│   └── ...
├── context/
│   └── AuthContext.tsx   # Login, logout, usuário, can(roles)
└── lib/
    └── api.ts             # Cliente HTTP, endpoints e tipos
```

---

## Permissões por role

| Recurso      | admin / ceo | programador / designer | vendedor | suporte |
|-------------|-------------|-------------------------|----------|---------|
| Usuários    | CRUD + excluir | —                    | —        | —       |
| Projetos/Posts | CRUD + excluir | CRUD (excluir só admin/ceo) | —   | —       |
| Clientes    | CRUD + excluir | CRUD (sem excluir)     | CRUD (sem excluir) | Leitura |
| Chamados    | CRUD         | CRUD                    | CRUD     | CRUD    |
| Contatos    | Sim          | Sim                     | Sim      | Sim     |
| Notificações| Sim          | Sim                     | Sim      | Sim     |

---

## Licença

Projeto privado — Rootbits.
