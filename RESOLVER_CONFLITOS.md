# 🔧 Resolver Conflitos de Atualização

## Situação Atual

Você está tentando atualizar o sistema, mas há mudanças locais que conflitam com as atualizações do GitHub:

- `package.json` - modificado localmente
- `package-lock.json` - modificado localmente  
- `scripts/update.sh` - arquivo não rastreado (existe localmente e no remoto)

## ✅ Solução Rápida (Recomendada)

Se você não precisa das mudanças locais (geralmente são apenas arquivos gerados automaticamente):

```bash
cd /home/zroot/AB-FINANCEIRO

# 1. Parar o serviço
sudo systemctl stop financeiro.service

# 2. Descartar mudanças locais e usar versão do GitHub
git reset --hard origin/main
git clean -fd

# 3. Fazer pull das atualizações
git pull origin main

# 4. Instalar dependências e fazer build
npm install
npm run db:generate
npm run db:migrate
npm run build

# 5. Reiniciar o serviço
sudo systemctl start financeiro.service

# 6. Verificar status
sudo systemctl status financeiro.service
```

## 🔄 Solução com Script Melhorado

O script de atualização foi melhorado para lidar automaticamente com essas situações. 

**Primeiro, você precisa atualizar o script no servidor:**

```bash
cd /home/zroot/AB-FINANCEIRO

# Fazer backup do script atual (se existir)
cp scripts/update.sh scripts/update.sh.backup 2>/dev/null || true

# Descartar mudanças locais temporariamente para pegar o script atualizado
git checkout -- scripts/update.sh 2>/dev/null || true

# Ou baixar a versão mais recente do GitHub
git fetch origin
git checkout origin/main -- scripts/update.sh

# Tornar executável
chmod +x scripts/update.sh

# Agora executar o script (ele vai lidar com os conflitos automaticamente)
./scripts/update.sh
```

Quando o script detectar mudanças locais, escolha a opção apropriada:

- **Opção 1 (Stash)** - Se você tem mudanças importantes
- **Opção 2 (Descartar)** - Se as mudanças são apenas arquivos gerados (recomendado)

## 📝 Solução Manual Passo a Passo

Se preferir fazer manualmente:

```bash
cd /home/zroot/AB-FINANCEIRO

# 1. Ver o que está modificado
git status

# 2. Ver diferenças (opcional)
git diff package.json
git diff package-lock.json

# 3. Parar o serviço
sudo systemctl stop financeiro.service

# 4. Fazer stash das mudanças (salvar temporariamente)
git stash push -m "Mudanças locais antes de atualizar $(date)"

# 5. Limpar arquivos não rastreados que podem causar conflito
git clean -fd

# 6. Fazer pull
git pull origin main

# 7. Instalar dependências
npm install

# 8. Gerar Prisma e fazer build
npm run db:generate
npm run db:migrate
npm run build

# 9. Reiniciar serviço
sudo systemctl start financeiro.service

# 10. Verificar se funcionou
sudo systemctl status financeiro.service
```

## ⚠️ Se Ainda Houver Problemas

### Verificar logs do serviço:
```bash
sudo journalctl -u financeiro.service -n 50
```

### Verificar se o build foi feito:
```bash
ls -la .next
```

### Testar manualmente:
```bash
npm start
```

### Verificar variáveis de ambiente:
```bash
cat .env
```

## 💡 Dica: Evitar Conflitos no Futuro

Para evitar esses problemas no futuro:

1. **Não modifique arquivos diretamente no servidor** - faça mudanças no repositório local e faça commit/push
2. **Use o script de atualização** - ele agora lida automaticamente com conflitos
3. **Faça backup antes de atualizar** - especialmente do banco de dados

## 🔐 Backup do Banco de Dados (Recomendado)

Antes de atualizar, faça backup:

```bash
# Backup do PostgreSQL (se usando Docker)
docker exec financeiro_postgres pg_dump -U financeiro financeiro_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou se PostgreSQL estiver rodando diretamente
pg_dump -U financeiro financeiro_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

