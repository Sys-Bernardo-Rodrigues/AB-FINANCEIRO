# ⏰ Configuração de Tarefas Automáticas (Cron Jobs)

Este documento descreve como configurar as tarefas automáticas do sistema financeiro.

## 📋 Tarefas Disponíveis

### 1. **Processamento de Transações Recorrentes**
**Endpoint**: `POST /api/cron/process-recurring`

**Função**: Processa automaticamente transações recorrentes que estão vencidas, criando as transações correspondentes.

**Frequência Recomendada**: Diária (1x por dia)

**Como funciona**:
- Busca todas as transações recorrentes ativas que estão vencidas
- Cria transações automaticamente para cada uma
- Atualiza a próxima data de vencimento
- Desativa transações que passaram da data de término
- Cria notificações para transações que vencem em até 3 dias

### 2. **Verificação de Notificações**
**Endpoint**: `POST /api/cron/check-notifications`

**Função**: Verifica condições que requerem notificações e as cria automaticamente.

**Frequência Recomendada**: A cada 6 horas

### 3. **Sincronização de Planos**
**Endpoint**: `POST /api/cron/sync-plans`

**Função**: Sincroniza o `currentAmount` de todos os planos com as transações reais, corrigindo inconsistências.

**Frequência Recomendada**: Semanal (1x por semana)

### 4. **Sincronização de Parcelamentos**
**Endpoint**: `POST /api/cron/sync-installments`

**Função**: Sincroniza o `currentInstallment` de todos os parcelamentos com as transações reais, corrigindo inconsistências.

**Frequência Recomendada**: Semanal (1x por semana)

### 5. **Processamento de Transações Agendadas Vencidas**
**Endpoint**: `POST /api/cron/process-scheduled`

**Função**: Processa automaticamente transações agendadas que já venceram, confirmando-as e atualizando planos vinculados.

**Frequência Recomendada**: Diária (1x por dia)

**Como funciona**:
- Busca todas as transações agendadas com `scheduledDate <= hoje`
- Confirma automaticamente cada transação
- Atualiza `Plan.currentAmount` se transação estiver vinculada a um plano
- Atualiza status do plano se necessário

**Como funciona**:
- Busca todos os planos ativos e completos
- Recalcula `currentAmount` baseado nas transações reais
- Atualiza planos com diferenças significativas
- Atualiza status para `COMPLETED` se necessário

**Como funciona**:
- Verifica saldo negativo de todos os usuários
- Verifica transações recorrentes próximas (até 3 dias)
- Cria notificações apenas se não existir uma recente (últimas 24h)

## 🔐 Autenticação

As rotas de cron requerem autenticação via header `Authorization`:

```
Authorization: Bearer {CRON_SECRET}
```

Configure a variável de ambiente `CRON_SECRET` no arquivo `.env`:

```env
CRON_SECRET=seu-secret-aqui-mude-em-producao
```

## 🚀 Configuração

### Opção 1: Cron Job no Servidor (Recomendado)

#### Linux/Mac (crontab)

```bash
# Editar crontab
crontab -e

# Adicionar tarefas (ajuste a URL para seu domínio)
# Processar recorrentes diariamente às 2h da manhã
0 2 * * * curl -X POST https://seu-dominio.com/api/cron/process-recurring -H "Authorization: Bearer ${CRON_SECRET}"

# Verificar notificações a cada 6 horas
0 */6 * * * curl -X POST https://seu-dominio.com/api/cron/check-notifications -H "Authorization: Bearer ${CRON_SECRET}"

# Sincronizar planos semanalmente (domingo às 3h)
0 3 * * 0 curl -X POST https://seu-dominio.com/api/cron/sync-plans -H "Authorization: Bearer ${CRON_SECRET}"

# Sincronizar parcelamentos semanalmente (domingo às 3h30)
30 3 * * 0 curl -X POST https://seu-dominio.com/api/cron/sync-installments -H "Authorization: Bearer ${CRON_SECRET}"

# Processar transações agendadas vencidas diariamente às 1h
0 1 * * * curl -X POST https://seu-dominio.com/api/cron/process-scheduled -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Windows (Task Scheduler)

1. Abra o "Agendador de Tarefas"
2. Crie uma nova tarefa
3. Configure para executar:
   ```
   curl -X POST http://localhost:3000/api/cron/process-recurring -H "Authorization: Bearer seu-secret"
   ```
4. Configure a frequência desejada

### Opção 2: Serviços de Cron Online

#### Vercel Cron (Recomendado para Vercel)

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-notifications",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/sync-plans",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/sync-installments",
      "schedule": "30 3 * * 0"
    },
    {
      "path": "/api/cron/process-scheduled",
      "schedule": "0 1 * * *"
    }
  ]
}
```

#### Outros Serviços

- **EasyCron**: https://www.easycron.com/
- **Cron-Job.org**: https://cron-job.org/
- **Uptime Robot**: https://uptimerobot.com/

Configure para fazer requisições POST para os endpoints com o header de autorização.

### Opção 3: Execução Manual (Desenvolvimento)

Para testar manualmente:

```bash
# Processar recorrentes
curl -X POST http://localhost:3000/api/cron/process-recurring \
  -H "Authorization: Bearer default-secret"

# Verificar notificações
curl -X POST http://localhost:3000/api/cron/check-notifications \
  -H "Authorization: Bearer default-secret"
```

## 📊 Verificação de Status

Você pode verificar o status das tarefas sem executá-las usando GET:

```bash
# Ver quantas recorrentes estão vencidas
curl http://localhost:3000/api/cron/process-recurring

# Ver quantos usuários precisam de notificações
curl http://localhost:3000/api/cron/check-notifications
```

## 🔍 Logs

Todas as operações são registradas no Redis. Você pode visualizar os logs através da API:

```bash
GET /api/logs
```

## ⚠️ Importante

1. **Segurança**: Sempre use um `CRON_SECRET` forte em produção
2. **Frequência**: Não execute com frequência excessiva para evitar sobrecarga
3. **Monitoramento**: Monitore os logs para garantir que as tarefas estão executando corretamente
4. **Backup**: Certifique-se de ter backups do banco de dados antes de executar tarefas automáticas em produção

## 📝 Exemplo de Resposta

### Processamento de Recorrentes

```json
{
  "success": true,
  "message": "Processamento concluído",
  "processed": 5,
  "notifications": 3,
  "total": 8
}
```

### Verificação de Notificações

```json
{
  "success": true,
  "message": "Verificação concluída",
  "notificationsCreated": 2,
  "usersProcessed": 10
}
```

## 🎯 Próximos Passos

1. Configure o `CRON_SECRET` no `.env`
2. Configure um serviço de cron (Vercel Cron, EasyCron, etc.)
3. Monitore os logs para garantir execução correta
4. Ajuste as frequências conforme necessário

