# 🔌 Sistema de Portas Aleatórias

## 📋 Visão Geral

O sistema AB Financeiro agora usa **portas aleatórias** para evitar conflitos com outros serviços que possam estar rodando na sua máquina.

## 🎯 Como Funciona

### Portas Geradas Automaticamente

Quando você executa `npm run ports:generate`, o sistema:

1. ✅ Gera uma porta aleatória para PostgreSQL (entre 10000-65535)
2. ✅ Gera uma porta aleatória para Redis (entre 10000-65535)
3. ✅ Atualiza o arquivo `.env` com as novas portas
4. ✅ Garante que as portas não conflitem entre si

### Docker Compose

O `docker-compose.yml` está configurado para usar variáveis de ambiente:

- **PostgreSQL**: Usa `POSTGRES_PORT` do `.env` (padrão: porta aleatória)
- **Redis**: Usa `REDIS_PORT` do `.env` (padrão: porta aleatória)

Se a variável não estiver definida ou for `0`, o Docker escolhe uma porta aleatória automaticamente.

## 🚀 Como Usar

### 1. Gerar Portas Aleatórias

```bash
npm run ports:generate
```

Isso criará/atualizará o arquivo `.env` com as portas geradas.

### 2. Verificar Portas Geradas

Após executar o script, você verá algo como:

```
🔧 Gerando portas aleatórias para evitar conflitos...

✅ PostgreSQL: 15432
✅ Redis: 16379
✅ Next.js: 3000

💡 Essas portas serão usadas no docker-compose.yml e .env
```

### 3. Iniciar Containers

```bash
npm run docker:up
```

Os containers serão iniciados nas portas geradas.

### 4. Verificar Portas em Uso

Para ver quais portas estão sendo usadas:

```bash
docker-compose ps
```

Ou:

```bash
docker ps
```

## 📝 Arquivo .env

O arquivo `.env` será atualizado automaticamente com:

```env
POSTGRES_PORT=15432
REDIS_PORT=16379
DATABASE_URL="postgresql://financeiro:financeiro123@localhost:15432/financeiro_db?schema=public"
REDIS_URL="redis://localhost:16379"
```

## ⚙️ Configuração Manual

Se preferir definir portas manualmente, edite o `.env`:

```env
POSTGRES_PORT=5432
REDIS_PORT=6379
```

E atualize as URLs:

```env
DATABASE_URL="postgresql://financeiro:financeiro123@localhost:5432/financeiro_db?schema=public"
REDIS_URL="redis://localhost:6379"
```

## 🔍 Verificar Portas Disponíveis

Para verificar se uma porta está em uso no Windows:

```powershell
netstat -ano | findstr :PORTA
```

No Linux/Mac:

```bash
lsof -i :PORTA
```

## 💡 Dicas

1. **Execute `ports:generate` sempre que houver conflito de portas**
2. **As portas são salvas no `.env`, então não precisa gerar toda vez**
3. **Se mudar as portas, reinicie os containers: `docker-compose down && docker-compose up -d`**
4. **Portas entre 10000-65535 são menos propensas a conflitos**

## 🐛 Solução de Problemas

### Porta já em uso

Se receber erro de porta em uso:

1. Execute `npm run ports:generate` novamente
2. Ou defina uma porta manual no `.env`
3. Reinicie os containers

### Containers não iniciam

Verifique se as portas no `.env` correspondem às do `docker-compose.yml`:

```bash
# Verificar .env
cat .env | grep PORT

# Verificar containers
docker-compose ps
```

## 📚 Referências

- [Docker Compose Ports](https://docs.docker.com/compose/compose-file/compose-file-v3/#ports)
- [Portas Reservadas](https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers)



