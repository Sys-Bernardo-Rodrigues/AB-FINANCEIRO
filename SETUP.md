# 🚀 Guia de Configuração - Sistema Financeiro

Este guia irá te ajudar a configurar o sistema financeiro do zero.

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** 20 ou superior
- **Docker** e **Docker Compose**
- **npm** ou **yarn**

## 🔧 Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

O arquivo `.env` já está configurado com as credenciais padrão do Docker Compose.

### 3. Iniciar Containers Docker

Inicie o PostgreSQL e Redis:

```bash
npm run docker:up
```

Ou manualmente:

```bash
docker-compose up -d
```

Aguarde alguns segundos para os containers iniciarem completamente.

### 4. Verificar Status dos Containers

```bash
docker-compose ps
```

Você deve ver os containers `financeiro_postgres` e `financeiro_redis` rodando.

### 5. Configurar o Banco de Dados

#### 5.1. Gerar o Cliente Prisma

```bash
npm run db:generate
```

#### 5.2. Executar Migrações

```bash
npm run db:migrate
```

Quando solicitado, dê um nome à migração (ex: `init`).

#### 5.3. Popular o Banco com Dados Iniciais (Opcional)

```bash
npx prisma db seed
```

Isso criará categorias padrão como:
- Salário
- Freelance
- Alimentação
- Transporte
- Utilidades
- Lazer

### 6. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 7. Acessar a Aplicação

Abra seu navegador em:

```
http://localhost:3000
```

## 🛠️ Comandos Úteis

### Docker

```bash
# Iniciar containers
npm run docker:up

# Parar containers
npm run docker:down

# Ver logs
npm run docker:logs

# Ver logs apenas do PostgreSQL
docker-compose logs -f postgres

# Ver logs apenas do Redis
docker-compose logs -f redis

# Parar e remover volumes (CUIDADO: apaga os dados)
docker-compose down -v
```

### Banco de Dados

```bash
# Abrir Prisma Studio (interface visual)
npm run db:studio

# Criar nova migração
npm run db:migrate

# Resetar banco de dados (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Ver status das migrações
npx prisma migrate status
```

## 🔍 Verificando se Tudo Está Funcionando

### 1. Verificar Conexão com PostgreSQL

```bash
docker-compose exec postgres psql -U financeiro -d financeiro_db -c "SELECT version();"
```

### 2. Verificar Conexão com Redis

```bash
docker-compose exec redis redis-cli ping
```

Deve retornar: `PONG`

### 3. Verificar Logs no Redis

Acesse a API de logs:

```
http://localhost:3000/api/logs
```

## 🐛 Solução de Problemas

### Erro: "Cannot connect to database"

1. Verifique se os containers estão rodando:
   ```bash
   docker-compose ps
   ```

2. Verifique as variáveis de ambiente no `.env`

3. Tente reiniciar os containers:
   ```bash
   npm run docker:down
   npm run docker:up
   ```

### Erro: "Prisma Client not generated"

Execute:

```bash
npm run db:generate
```

### Erro: "Migration failed"

1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no `.env`
3. Tente resetar as migrações (CUIDADO: apaga dados):
   ```bash
   npx prisma migrate reset
   ```

### Erro: "Redis connection failed"

1. Verifique se o container Redis está rodando
2. Verifique a URL do Redis no `.env`
3. Reinicie o container:
   ```bash
   docker-compose restart redis
   ```

## 📊 Acessando o Banco de Dados

### Via Prisma Studio

```bash
npm run db:studio
```

Isso abrirá uma interface web em `http://localhost:5555`

### Via psql (linha de comando)

```bash
docker-compose exec postgres psql -U financeiro -d financeiro_db
```

## 🎯 Próximos Passos

Após a configuração, você pode:

1. Acessar o dashboard em `http://localhost:3000`
2. Adicionar transações em `/add`
3. Visualizar todas as transações em `/transactions`
4. Ver logs do sistema em `/api/logs`

## 📝 Notas Importantes

- Os dados do PostgreSQL são persistidos no volume `postgres_data`
- Os dados do Redis são persistidos no volume `redis_data`
- Para limpar tudo e começar do zero:
  ```bash
  docker-compose down -v
  npm run docker:up
  npm run db:migrate
  npx prisma db seed
  ```

## 🆘 Precisa de Ajuda?

Se encontrar problemas, verifique:

1. Logs dos containers: `npm run docker:logs`
2. Logs do Next.js no terminal
3. Console do navegador (F12)
4. Arquivo `.env` está configurado corretamente

