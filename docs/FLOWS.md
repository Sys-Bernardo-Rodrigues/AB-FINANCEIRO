# Fluxos do Sistema

Documentação detalhada dos principais fluxos do sistema AB Financeiro.

## 🔐 Fluxo de Autenticação

### Login

```
1. Usuário acessa /login
2. Preenche email e senha
3. Frontend: POST /api/auth/login
   Body: { email, password }
4. Backend valida credenciais
5. Se válido:
   - Gera JWT token
   - Define cookie HTTP-only 'token'
   - Retorna dados do usuário
6. Frontend redireciona para / (dashboard)
7. Frontend verifica autenticação: GET /api/auth/me
8. Se autenticado, carrega dashboard
```

### Verificação de Autenticação

```
1. A cada requisição, cookie 'token' é enviado automaticamente
2. Backend verifica token em /api/auth/me
3. Se token válido:
   - Retorna dados do usuário
4. Se token inválido/expirado:
   - Retorna 401
   - Frontend redireciona para /login
```

### Logout

```
1. Usuário clica em "Sair"
2. Frontend: POST /api/auth/logout
3. Backend remove cookie 'token'
4. Frontend redireciona para /login
```

---

## 💰 Fluxo de Transações

### Criar Transação

```
1. Usuário acessa /add ou /transactions
2. Preenche formulário:
   - Descrição
   - Valor
   - Tipo (Receita/Despesa)
   - Categoria
   - Data
   - Cartão de crédito (opcional)
   - Planejamento (opcional)
3. Frontend: POST /api/transactions
   Body: { description, amount, type, categoryId, date, ... }
4. Backend valida dados
5. Se válido:
   - Cria transação associada ao userId
   - Se usuário está em grupo: transação fica visível para todos
   - Retorna transação criada
6. Frontend atualiza lista de transações
7. Frontend atualiza dashboard (se necessário)
```

### Listar Transações

```
1. Usuário acessa /transactions
2. Frontend: GET /api/transactions?limit=50
3. Backend:
   - Verifica grupos do usuário
   - Se em grupo: busca transações de todos os membros
   - Se não: busca apenas do usuário
   - Aplica filtros (tipo, categoria, data, etc.)
   - Retorna array de transações
4. Frontend exibe lista
```

### Editar Transação

```
1. Usuário clica em "Editar" em uma transação
2. Frontend carrega dados da transação: GET /api/transactions/[id]
3. Usuário modifica dados
4. Frontend: PUT /api/transactions/[id]
   Body: { description, amount, ... }
5. Backend atualiza transação
6. Frontend atualiza lista
```

### Deletar Transação

```
1. Usuário clica em "Deletar"
2. Frontend confirma ação
3. Frontend: DELETE /api/transactions/[id]
4. Backend remove transação
5. Frontend atualiza lista
```

---

## 📊 Fluxo do Dashboard

### Carregar Dashboard

```
1. Usuário acessa / (home)
2. Frontend: GET /api/dashboard?month=1&year=2026
3. Backend:
   a. Verifica grupos do usuário
   b. Se em grupo:
      - Busca transações de todos os membros do mês
   c. Se não:
      - Busca apenas transações do usuário
   d. Calcula:
      - Total de receitas
      - Total de despesas
      - Saldo (receitas - despesas)
      - Médias diárias
      - Variações do mês anterior
      - Métricas avançadas
   e. Retorna dados consolidados
4. Frontend exibe:
   - Card de saldo principal
   - Cards de receitas e despesas
   - Estatísticas
   - Transações recentes
   - Gráficos (se houver)
```

### Navegar Entre Meses

```
1. Usuário clica em "Mês Anterior" ou "Próximo Mês"
2. Frontend atualiza parâmetros: month e year
3. Frontend: GET /api/dashboard?month=X&year=Y
4. Backend recalcula dados do novo mês
5. Frontend atualiza exibição
```

---

## 👨‍👩‍👧‍👦 Fluxo de Grupos de Família

### Criar Grupo

```
1. Admin acessa /family-groups
2. Clica em "Novo Grupo"
3. Preenche nome e descrição
4. Frontend: POST /api/family-groups
   Body: { name, description }
5. Backend:
   - Cria grupo
   - Adiciona criador como ADMIN automaticamente
   - Retorna grupo criado
6. Frontend atualiza lista de grupos
```

### Adicionar Membro

```
1. Admin acessa grupo específico
2. Clica em "Adicionar Membro"
3. Informa email do usuário
4. Frontend: POST /api/family-groups/[id]/members
   Body: { userEmail: "email@exemplo.com" }
5. Backend:
   - Busca usuário pelo email
   - Verifica se já é membro
   - Adiciona como MEMBER
   - Retorna membro adicionado
6. Frontend atualiza lista de membros
```

### Compartilhamento Automático

```
1. Usuário A e Usuário B estão no mesmo grupo
2. Usuário A cria transação
3. Backend salva transação com userId = A
4. Quando Usuário B busca transações:
   - Backend detecta que B está em grupo com A
   - Busca transações de todos os membros (incluindo A)
   - Retorna transações de A e B
5. Dashboard de B mostra dados consolidados de A e B
```

### Remover Membro

```
1. Admin acessa grupo
2. Clica em "Remover" ao lado do membro
3. Frontend confirma ação
4. Frontend: DELETE /api/family-groups/[id]/members/[userId]
5. Backend:
   - Verifica se é admin
   - Verifica se não é último admin
   - Remove membro do grupo
6. Membro perde acesso aos dados compartilhados
```

---

## 📁 Fluxo de Categorias

### Criar Categoria

```
1. Usuário acessa /categories/manage
2. Clica em "Nova Categoria"
3. Preenche nome, tipo e descrição
4. Frontend: POST /api/categories
   Body: { name, type, description }
5. Backend:
   - Valida que nome é único para usuário e tipo
   - Cria categoria associada ao userId
   - Retorna categoria criada
6. Frontend atualiza lista
```

**Nota**: Categorias são individuais, mesmo em grupos de família.

---

## 💳 Fluxo de Cartões de Crédito

### Criar Cartão

```
1. Usuário acessa /credit-cards
2. Clica em "Adicionar Cartão"
3. Preenche nome, limite e dia de pagamento
4. Frontend: POST /api/credit-cards
   Body: { name, limit, paymentDay }
5. Backend cria cartão
6. Frontend atualiza lista
```

### Usar Cartão em Transação

```
1. Ao criar transação, usuário seleciona cartão
2. Frontend: POST /api/transactions
   Body: { ..., creditCardId: "uuid" }
3. Backend associa transação ao cartão
4. Transação não afeta saldo imediatamente
5. Saldo do cartão é calculado separadamente
```

---

## 📦 Fluxo de Parcelamentos

### Criar Parcelamento

```
1. Usuário acessa /installments
2. Clica em "Novo Parcelamento"
3. Preenche:
   - Descrição
   - Valor total
   - Número de parcelas
   - Categoria
   - Cartão (opcional)
4. Frontend: POST /api/installments
   Body: { description, totalAmount, installments, categoryId, ... }
5. Backend:
   - Cria parcelamento
   - Gera primeira transação automaticamente
   - Define status como ACTIVE
6. Frontend atualiza lista
```

### Pagar Parcela

```
1. Sistema detecta que parcela deve ser paga
2. Backend gera transação automaticamente
3. Incrementa currentInstallment
4. Se currentInstallment >= installments:
   - Status muda para COMPLETED
```

---

## 🎯 Fluxo de Planejamentos

### Criar Planejamento

```
1. Usuário acessa /plans
2. Clica em "Novo Planejamento"
3. Preenche:
   - Nome
   - Valor alvo
   - Data de início e fim
   - Categoria
4. Frontend: POST /api/plans
   Body: { name, targetAmount, startDate, endDate, categoryId }
5. Backend cria planejamento com currentAmount = 0
6. Frontend atualiza lista
```

### Associar Transação ao Planejamento

```
1. Ao criar transação, usuário seleciona planejamento
2. Frontend: POST /api/transactions
   Body: { ..., planId: "uuid" }
3. Backend:
   - Cria transação
   - Incrementa currentAmount do planejamento
   - Se currentAmount >= targetAmount:
     - Status muda para COMPLETED
```

---

## 🔔 Fluxo de Notificações

### Criar Notificação

```
1. Sistema detecta evento (ex: saldo negativo)
2. Backend cria notificação:
   POST /api/notifications (interno)
   Body: { title, message, type, userId }
3. Notificação é salva com status UNREAD
```

### Visualizar Notificações

```
1. Usuário acessa /notifications
2. Frontend: GET /api/notifications?status=UNREAD
3. Backend retorna notificações não lidas
4. Frontend exibe lista
```

### Marcar como Lida

```
1. Usuário clica em notificação
2. Frontend: PUT /api/notifications/[id]
   Body: { status: 'READ' }
3. Backend atualiza status e readAt
4. Frontend atualiza contador
```

---

## 📎 Fluxo de Comprovantes

### Upload de Comprovante

```
1. Usuário acessa transação
2. Clica em "Anexar Comprovante"
3. Seleciona arquivo (imagem ou PDF)
4. Frontend: POST /api/receipts
   Body: FormData com arquivo e transactionId
5. Backend:
   - Salva arquivo no sistema
   - Cria registro de comprovante
   - Associa à transação
6. Frontend atualiza exibição
```

### Visualizar Comprovante

```
1. Usuário clica em comprovante
2. Frontend: GET /api/receipts/[id]
3. Backend retorna arquivo
4. Frontend exibe (imagem) ou permite download (PDF)
```

---

## 🔄 Fluxo de Transações Recorrentes

### Criar Transação Recorrente

```
1. Usuário acessa /recurring
2. Clica em "Nova Recorrente"
3. Preenche:
   - Descrição
   - Valor
   - Frequência
   - Data de início
   - Categoria
4. Frontend: POST /api/recurring-transactions
   Body: { description, amount, frequency, startDate, categoryId, ... }
5. Backend cria recorrente com isActive = true
6. Sistema calcula nextDueDate
```

### Processar Recorrente

```
1. Cron job executa periodicamente
2. Busca recorrentes com nextDueDate <= hoje
3. Para cada recorrente:
   - Gera transação automaticamente
   - Atualiza lastExecuted
   - Calcula próximo nextDueDate
   - Se endDate chegou: isActive = false
```

---

## 📊 Fluxo de Relatórios

### Gerar Relatório

```
1. Usuário acessa /reports
2. Seleciona período (início e fim)
3. Frontend: GET /api/reports?startDate=X&endDate=Y
4. Backend:
   - Verifica grupos do usuário
   - Busca transações do período (de todos os membros se em grupo)
   - Calcula:
     - Totais por tipo
     - Por categoria
     - Por mês
     - Tendências
   - Retorna dados consolidados
5. Frontend exibe gráficos e tabelas
```

---

## ⚠️ Fluxo de Tratamento de Erros

### Erro de Autenticação

```
1. Requisição retorna 401
2. Frontend detecta erro
3. Frontend limpa estado de autenticação
4. Frontend redireciona para /login
5. Exibe mensagem: "Sessão expirada. Faça login novamente."
```

### Erro de Validação

```
1. Requisição retorna 400
2. Backend retorna:
   {
     "error": "Dados inválidos",
     "details": [
       { "field": "amount", "message": "Valor deve ser positivo" }
     ]
   }
3. Frontend exibe erros nos campos correspondentes
4. Usuário corrige e tenta novamente
```

### Erro de Permissão

```
1. Requisição retorna 403
2. Frontend exibe mensagem:
   "Você não tem permissão para esta ação"
3. Não redireciona (mantém na página)
```

---

## 🔍 Fluxo de Busca e Filtros

### Buscar Transações

```
1. Usuário digita no campo de busca
2. Frontend: GET /api/transactions?search=termo
3. Backend busca em description (case-insensitive)
4. Retorna transações que contêm o termo
5. Frontend atualiza lista
```

### Filtrar por Categoria

```
1. Usuário seleciona categoria no filtro
2. Frontend: GET /api/transactions?categoryId=uuid
3. Backend retorna apenas transações da categoria
4. Frontend atualiza lista
```

### Filtrar por Período

```
1. Usuário seleciona datas
2. Frontend: GET /api/transactions?startDate=X&endDate=Y
3. Backend retorna transações no período
4. Frontend atualiza lista
```

---

## 📱 Fluxo Mobile (PWA)

### Instalação

```
1. Usuário acessa site no mobile
2. Navegador oferece "Adicionar à Tela Inicial"
3. Usuário aceita
4. App é instalado como PWA
5. Funciona offline (com sincronização posterior)
```

### Modo Offline

```
1. Sistema detecta que está offline
2. Frontend armazena ações em IndexedDB
3. Quando volta online:
   - Sincroniza ações pendentes
   - Atualiza dados do servidor
```

---

Estes são os principais fluxos do sistema. Para detalhes específicos de cada endpoint, consulte [API.md](./API.md).






