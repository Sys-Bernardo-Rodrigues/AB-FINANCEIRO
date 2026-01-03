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

**Windows:**
- Node.js 20+ ([Download](https://nodejs.org/))
- Docker Desktop para Windows ([Download](https://www.docker.com/products/docker-desktop))
- Git para Windows ([Download](https://git-scm.com/download/win))
- npm (vem com Node.js)

**Linux/AlmaLinux:**
- Node.js 20+
- Docker e Docker Compose
- Git
- npm ou yarn

---

### Instalação no Windows

#### 1. Instalar Pré-requisitos

**Node.js:**
1. Baixe o instalador em [nodejs.org](https://nodejs.org/)
2. Execute o instalador e siga as instruções
3. Verifique a instalação:
   ```powershell
   node --version
   npm --version
   ```

**Docker Desktop:**
1. Baixe o Docker Desktop em [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Execute o instalador
3. Reinicie o computador se solicitado
4. Abra o Docker Desktop e aguarde a inicialização
5. Verifique a instalação:
   ```powershell
   docker --version
   docker-compose --version
   ```

#### 2. Clone o Repositório

```powershell
git clone <url-do-repositorio>
cd FINANCEIRO
```

#### 3. Instale as Dependências

```powershell
npm install
```

#### 4. Configure as Variáveis de Ambiente

**Opção A - Se existir `.env.example`:**
Copie o arquivo `.env.example` para `.env`:

```powershell
copy .env.example .env
```

**Opção B - O script criará o arquivo automaticamente:**
Se o arquivo `.env.example` não existir, o script criará o `.env` automaticamente.

Gere portas aleatórias para evitar conflitos:

```powershell
npm run ports:generate
```

Isso gerará portas aleatórias para PostgreSQL e Redis e criará/atualizará o arquivo `.env` automaticamente.

#### 5. Inicie os Containers Docker

```powershell
npm run docker:up
```

Ou manualmente:

```powershell
docker-compose up -d
```

#### 6. Configure o Banco de Dados

```powershell
# Gerar o cliente Prisma
npm run db:generate

# Executar as migrações
npm run db:migrate

# Popular o banco com dados iniciais (opcional)
npx prisma db seed
```

#### 7. Execute o Servidor de Desenvolvimento

```powershell
npm run dev
```

#### 8. Acesse a Aplicação

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

### Instalação no Linux/AlmaLinux

#### 1. Instalar Pré-requisitos

**Atualize o sistema:**
```bash
sudo dnf update -y
```

**Instalar Node.js 20+ (usando NodeSource):**
```bash
# Instalar curl se não estiver instalado
sudo dnf install -y curl

# Adicionar repositório NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Instalar Node.js
sudo dnf install -y nodejs

# Verificar instalação
node --version
npm --version
```

**Instalar Docker e Docker Compose:**
```bash
# Instalar Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar e habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker (para não precisar usar sudo)
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker compose version

# IMPORTANTE: Faça logout e login novamente para que as permissões do grupo docker sejam aplicadas
```

**Instalar Git:**
```bash
sudo dnf install -y git
```

#### 2. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd FINANCEIRO
```

#### 3. Instale as Dependências

```bash
npm install
```

#### 4. Configure as Variáveis de Ambiente

**Opção A - Se existir `.env.example`:**
Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

**Opção B - O script criará o arquivo automaticamente:**
Se o arquivo `.env.example` não existir, o script criará o `.env` automaticamente.

Gere portas aleatórias para evitar conflitos:

```bash
npm run ports:generate
```

Isso gerará portas aleatórias para PostgreSQL e Redis e criará/atualizará o arquivo `.env` automaticamente.

#### 5. Inicie os Containers Docker

```bash
npm run docker:up
```

Ou manualmente:

```bash
docker compose up -d
```

**Nota:** No Linux, você pode usar `docker compose` (com espaço) ou `docker-compose` (com hífen). O Docker Compose Plugin (v2) usa o formato com espaço.

#### 6. Configure o Banco de Dados

```bash
# Gerar o cliente Prisma
npm run db:generate

# Executar as migrações
npm run db:migrate

# Popular o banco com dados iniciais (opcional)
npx prisma db seed
```

#### 7. Execute o Servidor de Desenvolvimento

```bash
npm run dev
```

#### 8. Execute o Build para Produção

Antes de configurar como serviço, faça o build da aplicação:

```bash
npm run build
```

#### 9. Configure como Serviço Systemd (Recomendado para Produção)

Para que o sistema inicie automaticamente e rode como serviço no AlmaLinux:

**🚀 OPÇÃO 1: Script Automático (RECOMENDADO)**

Use o script fornecido que automatiza todo o processo:

```bash
# Dar permissão de execução ao script (se necessário)
chmod +x scripts/setup-service.sh

# Executar o script como root
sudo ./scripts/setup-service.sh
```

O script irá:
- ✅ Descobrir automaticamente os caminhos do npm/node
- ✅ Detectar o usuário atual e diretório do projeto
- ✅ Verificar se o build foi feito
- ✅ Criar o arquivo de serviço systemd
- ✅ Configurar permissões
- ✅ Habilitar e iniciar o serviço
- ✅ Mostrar o status e comandos úteis

**📝 OPÇÃO 2: Configuração Manual**

Se preferir configurar manualmente:

1. **Crie o arquivo de serviço systemd:**

```bash
sudo nano /etc/systemd/system/financeiro.service
```

2. **Primeiro, descubra o caminho do npm e node:**

```bash
# Descobrir onde está o npm
which npm

# Descobrir onde está o node
which node

# Verificar o caminho completo do npm
readlink -f $(which npm)
```

3. **Adicione o seguinte conteúdo ao arquivo (ajuste os caminhos conforme necessário):**

**IMPORTANTE:** Use o caminho do npm que você descobriu acima. Se o npm estiver em `/usr/bin/npm`, use esse. Se estiver em `/usr/local/bin/npm`, use esse.

**Template do serviço:**
```ini
[Unit]
Description=Sistema Financeiro - Next.js Application
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/home/seu_usuario/AB-FINANCEIRO
Environment="NODE_ENV=production"
EnvironmentFile=/home/seu_usuario/AB-FINANCEIRO/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=financeiro

[Install]
WantedBy=multi-user.target
```

**⚠️ IMPORTANTE - Substitua:**
- `seu_usuario` pelo seu usuário Linux (ex: `zroot`, `admin`, etc.)
- `/home/seu_usuario/AB-FINANCEIRO` pelo caminho completo do seu projeto
- `/usr/bin/npm` pelo caminho real do npm (use `which npm` para descobrir)

**Exemplo real (ajuste os valores):**
```ini
[Unit]
Description=Sistema Financeiro - Next.js Application
After=network.target

[Service]
Type=simple
User=zroot
WorkingDirectory=/home/zroot/AB-FINANCEIRO
Environment="NODE_ENV=production"
EnvironmentFile=/home/zroot/AB-FINANCEIRO/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=financeiro

[Install]
WantedBy=multi-user.target
```

**Alternativa:** Se o npm não funcionar, você pode usar o node diretamente (mais confiável):

```ini
[Unit]
Description=Sistema Financeiro - Next.js Application
After=network.target

[Service]
Type=simple
User=zroot
WorkingDirectory=/home/zroot/AB-FINANCEIRO
Environment="NODE_ENV=production"
EnvironmentFile=/home/zroot/AB-FINANCEIRO/.env
ExecStart=/usr/bin/node /home/zroot/AB-FINANCEIRO/node_modules/.bin/next start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=financeiro

[Install]
WantedBy=multi-user.target
```

3. **Recarregue o systemd e habilite o serviço:**

```bash
# Recarregar systemd para reconhecer o novo serviço
sudo systemctl daemon-reload

# Habilitar o serviço para iniciar no boot
sudo systemctl enable financeiro.service

# Iniciar o serviço
sudo systemctl start financeiro.service

# Verificar status
sudo systemctl status financeiro.service
```

5. **Comandos úteis para gerenciar o serviço:**

```bash
# Ver status
sudo systemctl status financeiro.service

# Parar o serviço
sudo systemctl stop financeiro.service

# Iniciar o serviço
sudo systemctl start financeiro.service

# Reiniciar o serviço
sudo systemctl restart financeiro.service

# Ver logs em tempo real
sudo journalctl -u financeiro.service -f

# Ver últimas 100 linhas dos logs
sudo journalctl -u financeiro.service -n 100

# Ver logs desde hoje
sudo journalctl -u financeiro.service --since today

# Desabilitar inicialização automática
sudo systemctl disable financeiro.service
```

6. **Verificar se o serviço está rodando:**

```bash
# Ver status detalhado
sudo systemctl status financeiro.service

# Verificar se a porta está aberta
sudo netstat -tlnp | grep :3000
# ou
sudo ss -tlnp | grep :3000

# Testar se a aplicação responde
curl http://localhost:3000
```

#### 10. Configure o Firewall (se necessário)

Se estiver acessando de outro computador, certifique-se de que a porta 3000 está aberta no firewall:

```bash
# Firewalld (AlmaLinux)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Verificar portas abertas
sudo firewall-cmd --list-ports
```

#### 11. Acesse a Aplicação

Abra [http://localhost:3000](http://localhost:3000) no seu navegador ou `http://seu-servidor-ip:3000` se estiver acessando remotamente.

**Nota:** Se você configurou o serviço systemd, a aplicação já deve estar rodando. Verifique com `sudo systemctl status financeiro.service`.

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
- `npm run update` - Atualiza o sistema do GitHub (ver [ATUALIZACAO.md](./ATUALIZACAO.md))
- `npm run update:no-restart` - Atualiza sem reiniciar o serviço
- `npm run update:no-build` - Atualiza sem fazer build

## 🔄 Atualização do Sistema

Para atualizar o sistema no servidor quando há novas versões no GitHub, consulte o guia completo em [ATUALIZACAO.md](./ATUALIZACAO.md).

**Método rápido:**

```bash
# Atualizar o sistema (recomendado)
npm run update

# Ou usar o script diretamente
./scripts/update.sh
```

O script de atualização:
- ✅ Busca atualizações do GitHub
- ✅ Instala novas dependências
- ✅ Executa migrações do banco
- ✅ Faz build da aplicação
- ✅ Reinicia o serviço automaticamente

## 🔒 Variáveis de Ambiente

### Desenvolvimento

Crie um arquivo `.env` na raiz do projeto com:

```env
# Ambiente
NODE_ENV="development"

# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://financeiro:financeiro123@localhost:5432/financeiro_db?schema=public"
POSTGRES_USER="financeiro"
POSTGRES_PASSWORD="financeiro123"
POSTGRES_DB="financeiro_db"
POSTGRES_PORT=5432

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PORT=6379

# JWT (Autenticação)
JWT_SECRET="seu-jwt-secret-super-seguro-aqui-altere-em-producao"

# Cron Jobs (para tarefas agendadas)
CRON_SECRET="seu-cron-secret-aqui"

# URL da Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Produção

Para produção, use valores seguros e específicos do seu ambiente:

```env
# Ambiente
NODE_ENV="production"

# Banco de Dados PostgreSQL
# Para servidores internos/Docker (sem SSL):
DATABASE_URL="postgresql://usuario_seguro:senha_super_forte@servidor-db:5432/financeiro_db?schema=public&sslmode=disable"

# Para servidores externos/cloud (com SSL):
# DATABASE_URL="postgresql://usuario_seguro:senha_super_forte@servidor-db:5432/financeiro_db?schema=public&sslmode=require"

POSTGRES_USER="usuario_seguro"
POSTGRES_PASSWORD="senha_super_forte_complexa_min_32_chars"
POSTGRES_DB="financeiro_db"
POSTGRES_PORT=5432

# Redis
# Para servidores locais/Docker SEM senha (padrão):
REDIS_URL="redis://localhost:6379"

# Para servidores COM senha (produção com autenticação):
# REDIS_URL="redis://:senha_redis_forte@servidor-redis:6379"
# Ou com SSL: REDIS_URL="rediss://:senha_redis_forte@servidor-redis:6380"

REDIS_PORT=6379

# JWT (Autenticação)
# IMPORTANTE: Gere uma string aleatória forte (mínimo 32 caracteres)
# Use: openssl rand -base64 32 ou node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET="sua-chave-jwt-super-segura-gerada-aleatoriamente-min-32-chars"

# Cron Jobs (para tarefas agendadas)
# IMPORTANTE: Use uma chave secreta diferente do JWT_SECRET
CRON_SECRET="sua-chave-cron-secreta-gerada-aleatoriamente"

# URL da Aplicação
# IMPORTANTE: Use o domínio real da sua aplicação em produção
NEXT_PUBLIC_APP_URL="https://seu-dominio.com.br"

# Porta do Next.js (opcional, padrão é 3000)
PORT=3000
```

### 🔐 Segurança em Produção

**IMPORTANTE:** Ao configurar para produção:

1. **Gere secrets fortes:**
   ```bash
   # JWT Secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Cron Secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Use senhas fortes** para PostgreSQL e Redis (mínimo 32 caracteres, com letras, números e símbolos)

3. **Habilite SSL/TLS** nas conexões de banco de dados

4. **Nunca commite** o arquivo `.env` no repositório (já deve estar no `.gitignore`)

5. **Use variáveis de ambiente** do seu provedor de hospedagem (Vercel, Railway, AWS, etc.) ao invés de arquivo `.env` quando possível

6. **Configure firewall** para permitir apenas conexões necessárias

7. **Use Redis com autenticação** em produção

### ❗ Troubleshooting - Erros Comuns

#### Erro: Redis AUTH sem senha configurada

**Erro:**
```
ERR AUTH <password> called without any password configured for the default user
```

**Causa:** A URL do Redis no `.env` está tentando usar autenticação, mas o servidor Redis não tem senha configurada.

**Solução:** Para Redis local/Docker sem senha, use a URL simples:

```env
REDIS_URL="redis://localhost:6379"
```

**NÃO use** (se o Redis não tiver senha):
```env
REDIS_URL="redis://:senha@localhost:6379"  # ❌ Erro!
```

#### Erro: PostgreSQL TLS/SSL

**Erro:**
```
Error opening a TLS connection: server does not support TLS
```

**Causa:** O Prisma está tentando usar TLS, mas o PostgreSQL não está configurado para isso.

**Solução:** Para servidores locais/internos, adicione `?sslmode=disable` na DATABASE_URL:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/database?schema=public&sslmode=disable"
```

#### Timeout durante o Build

**Erro:**
```
Static page generation timeout
```

**Causa:** O Next.js está tentando gerar páginas estáticas que dependem de APIs que fazem conexões com Redis/PostgreSQL durante o build.

**Soluções:**
1. Certifique-se de que Redis e PostgreSQL estão rodando antes do build
2. Para produção, considere usar `output: 'standalone'` no `next.config.js` ou gerar páginas dinamicamente
3. Verifique se as variáveis de ambiente estão corretas

#### Erro: Systemd Service Failed - Unavailable Resources

**Erro:**
```
Job for financeiro.service failed because of unavailable resources or another system error.
```

**Causa:** Geralmente é um problema com o caminho do executável (npm/node) ou permissões.

**Solução passo a passo:**

1. **Verifique o caminho do npm:**
   ```bash
   which npm
   # Pode retornar: /usr/bin/npm ou /usr/local/bin/npm
   ```

2. **Verifique se o arquivo .env existe e tem permissões corretas:**
   ```bash
   ls -la /home/zroot/AB-FINANCEIRO/.env
   # O arquivo deve existir e ser legível pelo usuário
   ```

3. **Verifique se o diretório existe:**
   ```bash
   ls -la /home/zroot/AB-FINANCEIRO
   # Deve mostrar o diretório do projeto
   ```

4. **Edite o arquivo de serviço e corrija o caminho:**
   ```bash
   sudo nano /etc/systemd/system/financeiro.service
   ```

5. **Use o caminho correto do npm (descoberto no passo 1):**
   - Se `which npm` retornou `/usr/bin/npm`, use: `ExecStart=/usr/bin/npm start`
   - Se retornou `/usr/local/bin/npm`, use: `ExecStart=/usr/local/bin/npm start`

6. **Alternativa mais confiável - Use node diretamente:**
   ```ini
   ExecStart=/usr/bin/node /home/zroot/AB-FINANCEIRO/node_modules/.bin/next start
   ```
   (Descubra o caminho do node com `which node`)

7. **Verifique os logs detalhados:**
   ```bash
   sudo journalctl -xeu financeiro.service
   # ou
   sudo systemctl status financeiro.service -l
   ```

8. **Teste manualmente se o comando funciona:**
   ```bash
   # Como o usuário do serviço (não como root)
   sudo -u zroot bash
   cd /home/zroot/AB-FINANCEIRO
   npm start
   # Se funcionar manualmente, o problema está no systemd
   # Se não funcionar, resolva primeiro os problemas de execução manual
   ```

9. **Após corrigir, recarregue e tente novamente:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start financeiro.service
   sudo systemctl status financeiro.service
   ```

**Outras causas comuns:**
- Usuário especificado não existe
- Diretório de trabalho não existe ou usuário não tem permissão
- Arquivo .env não existe ou não é legível
- Dependências não estão instaladas (npm install não foi executado)

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
