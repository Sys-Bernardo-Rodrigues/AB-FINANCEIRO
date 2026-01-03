# 🔄 Guia de Atualização do Sistema

Este guia explica como atualizar o Sistema Financeiro no servidor quando há novas versões disponíveis no GitHub.

## 📋 Métodos de Atualização

Existem três formas de atualizar o sistema:

1. **Script Automatizado** (Recomendado) ⭐
2. **Atualização Manual via Terminal**
3. **Atualização via Interface Web** (se disponível)

---

## 🚀 Método 1: Script Automatizado (Recomendado)

O script `update.sh` automatiza todo o processo de atualização.

### Uso Básico

```bash
# Navegar até o diretório do projeto
cd /home/zroot/AB-FINANCEIRO

# Executar o script de atualização
./scripts/update.sh
```

### Opções Disponíveis

```bash
# Atualizar sem reiniciar o serviço
./scripts/update.sh --no-restart

# Atualizar sem fazer build (útil para atualizações rápidas de arquivos estáticos)
./scripts/update.sh --no-build

# Combinar opções
./scripts/update.sh --no-restart --no-build
```

### O que o Script Faz

1. ✅ Verifica o status do Git
2. ✅ Busca atualizações do GitHub (`git fetch`)
3. ✅ Verifica se há atualizações disponíveis
4. ✅ Para o serviço systemd (se configurado)
5. ✅ Baixa as atualizações (`git pull`)
6. ✅ Instala novas dependências (`npm install`)
7. ✅ Gera cliente Prisma (`npm run db:generate`)
8. ✅ Executa migrações do banco (`npm run db:migrate`)
9. ✅ Faz build da aplicação (`npm run build`)
10. ✅ Reinicia o serviço systemd

### Exemplo de Saída

```
==========================================
  Atualização do Sistema Financeiro
==========================================

Diretório do projeto: /home/zroot/AB-FINANCEIRO

[1/7] Verificando status do Git...
[2/7] Buscando atualizações do GitHub...
  Fetch executado com sucesso ✓
[3/7] Verificando se há atualizações disponíveis...
  Atualizações disponíveis!
[4/7] Parando o serviço...
  Serviço parado com sucesso ✓
[5/7] Baixando atualizações do GitHub...
  Pull executado com sucesso ✓
[6/7] Instalando dependências e fazendo build...
  Dependências instaladas com sucesso ✓
  Cliente Prisma gerado com sucesso ✓
  Migrações executadas com sucesso ✓
  Build executado com sucesso ✓
[7/7] Reiniciando o serviço...
  Serviço reiniciado com sucesso ✓
  Serviço está rodando corretamente ✓

==========================================
Atualização concluída com sucesso!
==========================================
```

---

## 🔧 Método 2: Atualização Manual via Terminal

Se preferir fazer manualmente ou o script não funcionar, siga estes passos:

### Passo 1: Conectar ao Servidor

```bash
# Via SSH (substitua pelo seu usuário e IP)
ssh usuario@seu-servidor-ip
```

### Passo 2: Navegar até o Diretório do Projeto

```bash
cd /home/zroot/AB-FINANCEIRO
```

### Passo 3: Parar o Serviço (se estiver rodando como serviço)

```bash
sudo systemctl stop financeiro.service
```

**OU** se estiver rodando manualmente, pressione `Ctrl+C` no terminal onde está rodando.

### Passo 4: Verificar Status do Git

```bash
git status
```

### Passo 5: Buscar Atualizações do GitHub

```bash
git fetch origin
```

### Passo 6: Verificar se Há Atualizações

```bash
# Ver diferenças entre local e remoto
git log HEAD..origin/main --oneline

# Ou verificar o status
git status
```

### Passo 7: Baixar as Atualizações

```bash
# Se estiver na branch main
git pull origin main

# Ou se estiver em outra branch
git pull origin sua-branch
```

### Passo 8: Instalar Novas Dependências

```bash
npm install
```

### Passo 9: Gerar Cliente Prisma

```bash
npm run db:generate
```

### Passo 10: Executar Migrações do Banco (se houver)

```bash
npm run db:migrate
```

### Passo 11: Fazer Build da Aplicação

```bash
npm run build
```

### Passo 12: Reiniciar o Serviço

**Se estiver usando systemd:**

```bash
sudo systemctl start financeiro.service
# ou
sudo systemctl restart financeiro.service
```

**Se estiver rodando manualmente:**

```bash
npm start
```

### Passo 13: Verificar se Está Funcionando

```bash
# Ver status do serviço
sudo systemctl status financeiro.service

# Ver logs
sudo journalctl -u financeiro.service -f

# Testar se a aplicação responde
curl http://localhost:3000
```

---

## 🌐 Método 3: Atualização via Interface Web

Se você configurou a rota de atualização na interface web:

1. Acesse a página de Configurações (`/settings`)
2. Clique no botão "Atualizar Sistema"
3. Aguarde o processo de atualização
4. O sistema será reiniciado automaticamente

**Nota:** Este método requer que você esteja autenticado como administrador.

---

## ⚠️ Troubleshooting

### Erro: "git pull" com conflitos ou mudanças locais

O script agora detecta automaticamente mudanças locais e oferece opções:

**Quando o script detectar mudanças locais, você verá:**

```
Mudanças locais detectadas
 M package.json
 M package-lock.json
?? scripts/update.sh

Opções para lidar com mudanças locais:
  1) Fazer stash (salvar temporariamente e restaurar depois)
  2) Descartar mudanças locais (usar versão do servidor)
  3) Cancelar atualização
```

**Recomendações:**

- **Opção 1 (Stash)** - Use se você tem mudanças locais importantes que quer preservar
- **Opção 2 (Descartar)** - Use se as mudanças locais não são importantes ou são apenas arquivos gerados (package-lock.json)

**Se preferir resolver manualmente:**

```bash
# Ver arquivos em conflito
git status

# Opção 1: Descartar mudanças locais e usar a versão do servidor
git reset --hard origin/main
git clean -fd  # Remove arquivos não rastreados

# Opção 2: Fazer stash das mudanças
git stash push -m "Mudanças locais antes de atualizar"
git pull origin main
git stash pop  # Restaurar depois (pode ter conflitos)

# Opção 3: Fazer merge manual (recomendado se tiver mudanças importantes)
git merge origin/main
# Resolver conflitos manualmente nos arquivos
# Depois: git add . && git commit -m "Merge com origin/main"
```

### Erro: Build falha

```bash
# Limpar cache e node_modules
rm -rf .next node_modules package-lock.json

# Reinstalar tudo
npm install
npm run build
```

### Erro: Migrações do banco falham

```bash
# Ver status das migrações
npx prisma migrate status

# Se necessário, resetar migrações (CUIDADO: pode perder dados)
# npx prisma migrate reset

# Ou aplicar migrações manualmente
npx prisma migrate deploy
```

### Erro: Serviço não inicia após atualização

```bash
# Ver logs detalhados
sudo journalctl -xeu financeiro.service -n 100

# Verificar se o build foi feito
ls -la .next

# Verificar variáveis de ambiente
cat .env

# Testar manualmente
npm start
```

### Erro: Permissões negadas

```bash
# Verificar permissões do diretório
ls -la

# Corrigir permissões (substitua 'zroot' pelo seu usuário)
sudo chown -R zroot:zroot /home/zroot/AB-FINANCEIRO
chmod -R 755 /home/zroot/AB-FINANCEIRO
```

---

## 📝 Checklist de Atualização

Antes de atualizar, certifique-se de:

- [ ] Fazer backup do banco de dados (recomendado)
- [ ] Verificar se há mudanças locais não commitadas (`git status`)
- [ ] Verificar se o serviço está rodando (`sudo systemctl status financeiro.service`)
- [ ] Ter acesso SSH ao servidor
- [ ] Ter permissões sudo (para reiniciar o serviço)

Após atualizar, verifique:

- [ ] Serviço está rodando (`sudo systemctl status financeiro.service`)
- [ ] Aplicação responde (`curl http://localhost:3000`)
- [ ] Não há erros nos logs (`sudo journalctl -u financeiro.service -n 50`)
- [ ] Interface web está acessível
- [ ] Funcionalidades principais estão funcionando

---

## 🔄 Atualização Automática (Opcional)

Para configurar atualizações automáticas via cron:

```bash
# Editar crontab
crontab -e

# Adicionar linha para atualizar diariamente às 3h da manhã
0 3 * * * cd /home/zroot/AB-FINANCEIRO && ./scripts/update.sh --no-restart >> /var/log/financeiro-update.log 2>&1 && sudo systemctl restart financeiro.service
```

**⚠️ Cuidado:** Atualizações automáticas podem causar problemas se houver mudanças incompatíveis. Use com precaução.

---

## 📞 Suporte

Se encontrar problemas durante a atualização:

1. Verifique os logs: `sudo journalctl -u financeiro.service -n 100`
2. Verifique o status do Git: `git status`
3. Verifique se o build foi feito: `ls -la .next`
4. Teste manualmente: `npm start`

---

## 🔐 Segurança

**IMPORTANTE:** 

- Nunca commite o arquivo `.env` no repositório
- Sempre faça backup antes de atualizações importantes
- Teste atualizações em ambiente de desenvolvimento primeiro
- Mantenha senhas e secrets seguros

---

**Última atualização:** Este documento foi criado para facilitar o processo de atualização do sistema.

