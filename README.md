# Sistema Financeiro

Sistema de controle financeiro pessoal desenvolvido com Next.js, TypeScript, PostgreSQL e Redis. Projetado para ser totalmente responsivo e funcionar perfeitamente em dispositivos móveis e web.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Sistema de logs e cache
- **Docker** - Containerização
- **Lucide React** - Ícones modernos

## 📱 Características

- ✅ Design responsivo mobile-first
- ✅ Interface moderna e intuitiva
- ✅ Dashboard com resumo financeiro
- ✅ Gestão de transações (receitas e despesas)
- ✅ Sistema de categorias
- ✅ Navegação bottom bar para mobile
- ✅ Formulário para adicionar novas transações
- ✅ API REST completa
- ✅ Sistema de logs com Redis
- ✅ Docker Compose para desenvolvimento

## 🛠️ Instalação

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

### Passo a Passo

1. **Clone o repositório e instale as dependências:**

```bash
npm install
```

2. **Configure as variáveis de ambiente:**

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

3. **Inicie os containers Docker (PostgreSQL e Redis):**

```bash
npm run docker:up
```

Ou manualmente:

```bash
docker-compose up -d
```

4. **Configure o banco de dados:**

```bash
# Gerar o cliente Prisma
npm run db:generate

# Executar as migrações
npm run db:migrate

# Popular o banco com dados iniciais (opcional)
npx prisma db seed
```

5. **Execute o servidor de desenvolvimento:**

```bash
npm run dev
```

6. **Abra [http://localhost:3000](http://localhost:3000) no seu navegador.**

## 🐳 Docker

### Comandos úteis

```bash
# Iniciar containers
npm run docker:up

# Parar containers
npm run docker:down

# Ver logs dos containers
npm run docker:logs

# Ver logs apenas do PostgreSQL
docker-compose logs -f postgres

# Ver logs apenas do Redis
docker-compose logs -f redis
```

## 📁 Estrutura do Projeto

```
├── app/
│   ├── api/              # API Routes
│   │   ├── transactions/ # CRUD de transações
│   │   ├── categories/   # CRUD de categorias
│   │   ├── dashboard/    # Dados do dashboard
│   │   └── logs/         # Visualização de logs
│   ├── add/              # Página de adicionar transação
│   ├── transactions/     # Página de transações
│   ├── settings/         # Página de configurações
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Página inicial (Dashboard)
│   └── globals.css       # Estilos globais
├── components/
│   ├── Header.tsx        # Cabeçalho
│   ├── Navigation.tsx    # Navegação inferior
│   ├── Dashboard.tsx     # Componente do dashboard
│   ├── BalanceCard.tsx   # Card de saldo/receita/despesa
│   └── TransactionList.tsx # Lista de transações
├── lib/
│   ├── prisma.ts         # Cliente Prisma
│   └── redis.ts          # Cliente Redis e funções de log
├── prisma/
│   ├── schema.prisma     # Schema do banco de dados
│   └── seed.ts           # Seed do banco de dados
├── docker-compose.yml    # Configuração Docker
└── ...
```

## 🗄️ Banco de Dados

### Schema

- **Category**: Categorias de transações (Receitas/Despesas)
- **Transaction**: Transações financeiras

### Prisma Studio

Para visualizar e editar dados diretamente no banco:

```bash
npm run db:studio
```

Isso abrirá o Prisma Studio em `http://localhost:5555`

## 📊 API Endpoints

### Transações

- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/[id]` - Buscar transação
- `PUT /api/transactions/[id]` - Atualizar transação
- `DELETE /api/transactions/[id]` - Deletar transação

### Categorias

- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria

### Dashboard

- `GET /api/dashboard` - Dados do dashboard (saldo, receitas, despesas)

### Logs

- `GET /api/logs` - Visualizar logs do sistema

## 🔍 Logs

O sistema utiliza Redis para armazenar logs de todas as operações:

- Logs de informações (info)
- Logs de avisos (warn)
- Logs de erros (error)

Os logs são armazenados por 7 dias e mantém os 100 mais recentes em uma lista.

## 🎨 Próximos Passos

- [ ] Autenticação de usuários
- [ ] Gráficos e relatórios
- [ ] Exportação de dados (CSV, PDF)
- [ ] Modo escuro
- [ ] Notificações
- [ ] Metas financeiras
- [ ] Relatórios mensais/anuais

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa o linter
- `npm run db:migrate` - Executa migrações do banco
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:studio` - Abre Prisma Studio
- `npm run docker:up` - Inicia containers Docker
- `npm run docker:down` - Para containers Docker
- `npm run docker:logs` - Visualiza logs dos containers

## 🔒 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL="postgresql://financeiro:financeiro123@localhost:5432/financeiro_db?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
