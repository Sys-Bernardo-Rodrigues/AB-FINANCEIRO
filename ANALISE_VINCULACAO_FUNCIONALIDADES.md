# 🔗 Análise de Vinculação de Funcionalidades - Sistema Financeiro

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Mapa de Entidades e Relações](#mapa-de-entidades-e-relações)
3. [Fluxos de Dados Principais](#fluxos-de-dados-principais)
4. [Dependências entre Módulos](#dependências-entre-módulos)
5. [Integrações e Triggers Automáticos](#integrações-e-triggers-automáticos)
6. [Fluxos de Trabalho Principais](#fluxos-de-trabalho-principais)
7. [Diagrama de Conexões](#diagrama-de-conexões)

---

## 🎯 Visão Geral do Sistema

O Sistema Financeiro é uma aplicação integrada onde **todas as funcionalidades estão interconectadas** através de uma arquitetura baseada em **Transações** como núcleo central. Cada módulo contribui para o ecossistema financeiro completo do usuário.

### Princípio Central: **Transaction-Centric Architecture**

Todas as funcionalidades convergem para o modelo `Transaction`, que serve como:
- **Fonte única de verdade** para movimentações financeiras
- **Ponto de integração** entre diferentes módulos
- **Base para análises e relatórios**

---

## 🗺️ Mapa de Entidades e Relações

### 1. **Núcleo Central: User**

```
User (Usuário)
├── transactions (Transações) → Transaction[]
├── categories (Categorias) → Category[]
├── installments (Parcelamentos) → Installment[]
├── plans (Planejamentos) → Plan[]
├── recurringTransactions (Recorrentes) → RecurringTransaction[]
├── savingsGoals (Metas) → SavingsGoal[]
├── notifications (Notificações) → Notification[]
└── receipts (Comprovantes) → Receipt[]
```

**Relação**: Um usuário possui múltiplas entidades, todas isoladas por `userId`.

---

### 2. **Categoria como Organizador**

```
Category (Categoria)
├── transactions → Transaction[]
├── installments → Installment[]
├── plans → Plan[]
└── recurringTransactions → RecurringTransaction[]
```

**Relação**: Categorias organizam todas as movimentações financeiras por tipo (INCOME/EXPENSE).

---

### 3. **Transaction como Hub Central**

```
Transaction (Transação)
├── category → Category (obrigatório)
├── user → User (obrigatório)
├── installment → Installment? (opcional)
├── plan → Plan? (opcional)
├── receipts → Receipt[] (opcional)
└── Campos especiais:
    ├── isInstallment: Boolean
    ├── installmentId: String?
    ├── isScheduled: Boolean
    ├── scheduledDate: DateTime?
    └── planId: String?
```

**Relação**: Transaction é o ponto de convergência de todas as funcionalidades.

---

### 4. **Módulos Especializados**

#### **Installment (Parcelamento)**
```
Installment
├── category → Category
├── user → User
└── transactions → Transaction[] (múltiplas transações vinculadas)
```

**Relação**: Um parcelamento gera múltiplas transações (uma por parcela).

#### **Plan (Planejamento)**
```
Plan
├── category → Category
├── user → User
└── transactions → Transaction[] (transações vinculadas ao plano)
```

**Relação**: Um plano pode ter múltiplas transações que contribuem para o `currentAmount`.

#### **RecurringTransaction (Recorrente)**
```
RecurringTransaction
├── category → Category
├── user → User
└── Gera → Transaction (quando executada)
```

**Relação**: Uma transação recorrente gera transações automaticamente quando executada.

#### **SavingsGoal (Meta de Economia)**
```
SavingsGoal
├── user → User
└── Não gera Transaction diretamente
```

**Relação**: Metas são independentes, mas podem ser vinculadas a transações manualmente.

#### **Notification (Notificação)**
```
Notification
├── user → User
├── relatedId → String? (ID da entidade relacionada)
├── relatedType → String? (tipo: 'transaction', 'goal', etc.)
└── actionUrl → String? (URL para ação)
```

**Relação**: Notificações são geradas automaticamente por eventos do sistema.

#### **Receipt (Comprovante)**
```
Receipt
├── user → User
└── transaction → Transaction? (opcional)
```

**Relação**: Comprovantes podem ser vinculados a transações específicas.

---

## 🔄 Fluxos de Dados Principais

### 1. **Fluxo: Criação de Transação Manual**

```
User → TransactionForm
  ↓
POST /api/transactions
  ↓
Prisma: Transaction.create()
  ↓
┌─────────────────────────────────┐
│  Transaction criada             │
│  - Atualiza saldo do usuário    │
│  - Pode vincular a Plan         │
│  - Pode ter Receipt anexado     │
└─────────────────────────────────┘
  ↓
Dashboard atualizado
Reports atualizados
Trends Analysis atualizado
Notifications (se necessário)
```

**Impacto**: Afeta Dashboard, Reports, Trends, Calendar, Category Insights.

---

### 2. **Fluxo: Criação de Parcelamento**

```
User → InstallmentForm
  ↓
POST /api/installments
  ↓
┌─────────────────────────────────┐
│  1. Installment.create()        │
│  2. Transaction.create()        │ ← Primeira parcela
│     - isInstallment: true       │
│     - installmentId: vinculado │
└─────────────────────────────────┘
  ↓
POST /api/installments/[id]/next
  ↓
┌─────────────────────────────────┐
│  Transaction.create()           │ ← Próxima parcela
│  - Calcula data automaticamente │
│  - Atualiza currentInstallment │
└─────────────────────────────────┘
  ↓
Installment.status → COMPLETED (quando todas pagas)
```

**Impacto**: Gera múltiplas transações, afeta Dashboard, Reports, Calendar.

---

### 3. **Fluxo: Criação de Planejamento**

```
User → PlanForm
  ↓
POST /api/plans
  ↓
Plan.create()
  ↓
┌─────────────────────────────────┐
│  Plan criado                    │
│  - targetAmount definido        │
│  - currentAmount: 0            │
└─────────────────────────────────┘
  ↓
User cria Transaction vinculada
  ↓
POST /api/transactions
  ↓
┌─────────────────────────────────┐
│  Transaction.create()            │
│  - planId: vinculado            │
│  - Plan.currentAmount += amount│
│  - Plan.status → COMPLETED      │
│    (se currentAmount >= target) │
└─────────────────────────────────┘
```

**Impacto**: Transações contribuem para o progresso do plano, Dashboard mostra progresso.

---

### 4. **Fluxo: Transação Recorrente**

```
User → RecurringTransactionForm
  ↓
POST /api/recurring-transactions
  ↓
RecurringTransaction.create()
  ↓
┌─────────────────────────────────┐
│  Recorrente criada              │
│  - nextDueDate calculado        │
│  - frequency definida          │
└─────────────────────────────────┘
  ↓
POST /api/recurring-transactions/[id]/execute
  ↓
┌─────────────────────────────────┐
│  1. Transaction.create()        │ ← Transação gerada
│  2. RecurringTransaction.update()│
│     - nextDueDate recalculado   │
│     - lastExecuted atualizado   │
│     - isActive: false (se expirado)│
└─────────────────────────────────┘
  ↓
Notification (se próximo vencimento)
```

**Impacto**: Gera transações automaticamente, Dashboard mostra próximas vencimentos.

---

### 5. **Fluxo: Meta de Economia**

```
User → SavingsGoalForm
  ↓
POST /api/savings-goals
  ↓
SavingsGoal.create()
  ↓
POST /api/savings-goals/[id]/add-amount
  ↓
┌─────────────────────────────────┐
│  SavingsGoal.update()           │
│  - currentAmount += amount      │
│  - progress calculado           │
│  - status → COMPLETED           │
│    (se currentAmount >= target) │
└─────────────────────────────────┘
  ↓
Notification
  ├── notifyGoalProgress (se 80%+)
  └── notifyGoalCompleted (se 100%)
```

**Impacto**: Dashboard mostra progresso, Notifications alertam sobre progresso.

---

### 6. **Fluxo: Transação Agendada**

```
User → TransactionForm
  ↓
POST /api/transactions
  ↓
┌─────────────────────────────────┐
│  Transaction.create()            │
│  - isScheduled: true            │
│  - scheduledDate: definido      │
└─────────────────────────────────┘
  ↓
GET /api/transactions/scheduled
  ↓
POST /api/transactions/[id]/confirm
  ↓
┌─────────────────────────────────┐
│  Transaction.update()            │
│  - isScheduled: false            │
│  - date: scheduledDate           │
└─────────────────────────────────┘
```

**Impacto**: Calendar mostra transações agendadas, Dashboard lista próximas.

---

### 7. **Fluxo: Upload de Comprovante**

```
User → ReceiptUpload
  ↓
POST /api/receipts
  ↓
┌─────────────────────────────────┐
│  1. Arquivo salvo em /uploads   │
│  2. Receipt.create()             │
│     - transactionId: opcional   │
│     - userId: obrigatório       │
└─────────────────────────────────┘
  ↓
Vinculação com Transaction (opcional)
  ↓
PUT /api/receipts/[id]
  ↓
Receipt.update() → transactionId vinculado
```

**Impacto**: Comprovantes podem ser visualizados junto com transações.

---

## 🔗 Dependências entre Módulos

### Hierarquia de Dependências

```
┌─────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO         │
│  (Dashboard, Reports, Trends, etc.)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE API                   │
│  (/api/transactions, /api/dashboard)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE SERVIÇOS             │
│  (notifications, redis logs)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE DADOS                 │
│  (Prisma → PostgreSQL)                  │
└─────────────────────────────────────────┘
```

### Dependências Específicas

#### **Dashboard depende de:**
- ✅ Transactions (cálculo de saldo, receitas, despesas)
- ✅ Installments (próximas parcelas)
- ✅ Plans (planejamentos ativos)
- ✅ RecurringTransactions (próximas vencimentos)
- ✅ SavingsGoals (metas ativas)
- ✅ ScheduledTransactions (transações agendadas)
- ✅ Notifications (alertas)

#### **Reports depende de:**
- ✅ Transactions (agregação por categoria, período)
- ✅ Categories (agrupamento)
- ✅ Dashboard (métricas base)

#### **Trends Analysis depende de:**
- ✅ Transactions (histórico para análise temporal)
- ✅ Categories (tendências por categoria)
- ✅ Reports (dados agregados)

#### **Category Insights depende de:**
- ✅ Transactions (análise por categoria)
- ✅ Categories (informações da categoria)
- ✅ Trends (comparações temporais)

#### **Calendar depende de:**
- ✅ Transactions (transações por data)
- ✅ Installments (datas de vencimento)
- ✅ RecurringTransactions (próximas execuções)
- ✅ ScheduledTransactions (transações agendadas)

#### **Notifications depende de:**
- ✅ Dashboard (saldo negativo)
- ✅ Transactions (gastos acima da média)
- ✅ RecurringTransactions (próximos vencimentos)
- ✅ SavingsGoals (progresso e conclusão)

---

## ⚡ Integrações e Triggers Automáticos

### 1. **Sistema de Notificações Automáticas**

#### **Trigger: Saldo Negativo**
```
Dashboard GET /api/dashboard
  ↓
balance < 0
  ↓
notifyLowBalance(userId, balance)
  ↓
Notification.create()
  ├── type: 'DANGER'
  ├── title: 'Saldo Baixo'
  └── actionUrl: '/transactions'
```

#### **Trigger: Gasto Acima da Média**
```
Transaction POST /api/transactions
  ↓
Calcular média da categoria
  ↓
amount > average * 1.5
  ↓
notifyHighExpense(userId, category, amount, average)
  ↓
Notification.create()
  ├── type: 'WARNING'
  └── actionUrl: '/reports'
```

#### **Trigger: Meta Quase Completa**
```
SavingsGoal POST /api/savings-goals/[id]/add-amount
  ↓
progress = (currentAmount / targetAmount) * 100
  ↓
progress >= 80 && progress < 100
  ↓
notifyGoalProgress(userId, goalName, progress)
  ↓
Notification.create()
  ├── type: 'SUCCESS'
  └── actionUrl: '/savings-goals'
```

#### **Trigger: Meta Concluída**
```
SavingsGoal POST /api/savings-goals/[id]/add-amount
  ↓
currentAmount >= targetAmount
  ↓
notifyGoalCompleted(userId, goalName)
  ↓
Notification.create()
  ├── type: 'SUCCESS'
  └── actionUrl: '/savings-goals'
```

#### **Trigger: Transação Recorrente Próxima**
```
RecurringTransaction (verificação periódica)
  ↓
nextDueDate <= hoje + 3 dias
  ↓
notifyUpcomingRecurring(userId, description, date)
  ↓
Notification.create()
  ├── type: 'WARNING'
  └── actionUrl: '/recurring'
```

---

### 2. **Atualizações Automáticas de Status**

#### **Installment → COMPLETED**
```
POST /api/installments/[id]/next
  ↓
currentInstallment >= installments
  ↓
Installment.update()
  └── status: 'COMPLETED'
```

#### **Plan → COMPLETED**
```
POST /api/transactions (com planId)
  ↓
Plan.currentAmount += transaction.amount
  ↓
currentAmount >= targetAmount
  ↓
Plan.update()
  └── status: 'COMPLETED'
```

#### **RecurringTransaction → INACTIVE**
```
POST /api/recurring-transactions/[id]/execute
  ↓
nextDueDate > endDate (se endDate existe)
  ↓
RecurringTransaction.update()
  └── isActive: false
```

---

### 3. **Cálculos Automáticos**

#### **Dashboard Metrics**
```
GET /api/dashboard
  ↓
┌─────────────────────────────────┐
│  Cálculos automáticos:          │
│  - balance = income - expenses  │
│  - savingsRate = (income - expenses) / income * 100│
│  - averageBalance (últimos 30 dias)│
│  - daysUntilZero (projeção)    │
│  - mostUsedCategory            │
└─────────────────────────────────┘
```

#### **Category Insights**
```
GET /api/categories/insights
  ↓
┌─────────────────────────────────┐
│  Análises automáticas:          │
│  - Total gasto por categoria    │
│  - Média mensal                │
│  - Tendência (crescimento/queda)│
│  - Comparação com média geral  │
│  - Recomendações               │
└─────────────────────────────────┘
```

#### **Trends Analysis**
```
GET /api/trends
  ↓
┌─────────────────────────────────┐
│  Análises automáticas:          │
│  - Média móvel (7, 30 dias)    │
│  - Projeção de saldo           │
│  - Tendências por categoria    │
│  - Detecção de anomalias       │
└─────────────────────────────────┘
```

---

## 🎯 Fluxos de Trabalho Principais

### 1. **Fluxo: Gestão Financeira Completa**

```
┌─────────────────────────────────────────┐
│  1. Usuário cria Categorias            │
│     /api/categories                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Usuário cria Transações            │
│     /api/transactions                  │
│     - Vincula categoria                │
│     - Pode vincular a Plan             │
│     - Pode anexar Receipt             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Dashboard atualizado                │
│     - Saldo calculado                  │
│     - Métricas atualizadas             │
│     - Notificações geradas (se necessário)│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Reports e Trends atualizados        │
│     - Gráficos recalculados            │
│     - Análises atualizadas             │
└─────────────────────────────────────────┘
```

---

### 2. **Fluxo: Planejamento Financeiro**

```
┌─────────────────────────────────────────┐
│  1. Usuário cria Plan                  │
│     /api/plans                          │
│     - Define targetAmount               │
│     - Define período                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Usuário cria Transações            │
│     /api/transactions                   │
│     - Vincula planId                    │
│     - Plan.currentAmount atualizado    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Dashboard mostra progresso         │
│     - currentAmount / targetAmount     │
│     - Porcentagem de conclusão         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Plan.status → COMPLETED            │
│     (quando currentAmount >= target)   │
└─────────────────────────────────────────┘
```

---

### 3. **Fluxo: Automação com Recorrentes**

```
┌─────────────────────────────────────────┐
│  1. Usuário cria RecurringTransaction  │
│     /api/recurring-transactions        │
│     - Define frequency                 │
│     - Define nextDueDate               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Sistema verifica vencimentos        │
│     (processo periódico ou manual)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Usuário executa Recorrente         │
│     POST /api/recurring-transactions/[id]/execute│
│     - Transaction criada automaticamente│
│     - nextDueDate recalculado          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Dashboard e Reports atualizados     │
│     - Nova transação aparece           │
│     - Saldo atualizado                 │
└─────────────────────────────────────────┘
```

---

### 4. **Fluxo: Análise e Insights**

```
┌─────────────────────────────────────────┐
│  1. Usuário visualiza Dashboard        │
│     GET /api/dashboard                  │
│     - Métricas gerais                  │
│     - Transações recentes              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Usuário acessa Reports              │
│     GET /api/reports                    │
│     - Gráficos por categoria            │
│     - Gráficos temporais               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Usuário acessa Trends               │
│     GET /api/trends                     │
│     - Médias móveis                    │
│     - Projeções                        │
│     - Anomalias detectadas             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Usuário acessa Category Insights    │
│     GET /api/categories/insights        │
│     - Análise detalhada por categoria  │
│     - Recomendações personalizadas     │
└─────────────────────────────────────────┘
```

---

## 📊 Diagrama de Conexões

```
                    ┌─────────────┐
                    │    USER      │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   CATEGORY    │  │ TRANSACTION   │  │  INSTALLMENT  │
│               │  │   (CENTRAL)    │  │               │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│     PLAN      │  │   RECURRING    │  │ SAVINGS_GOAL  │
│               │  │  TRANSACTION   │  │               │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   RECEIPT     │  │ NOTIFICATION   │  │   SCHEDULED   │
│               │  │   (AUTO)       │  │  TRANSACTION   │
└───────────────┘  └───────────────┘  └───────────────┘
                           │
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   DASHBOARD   │  │    REPORTS    │  │    TRENDS     │
│  (AGREGAÇÃO)  │  │  (VISUALIZAÇÃO)│  │  (ANÁLISE)    │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 🎯 Conclusão

### Pontos-Chave da Arquitetura:

1. **Transaction-Centric**: Todas as funcionalidades convergem para o modelo `Transaction`
2. **Category-Based Organization**: Categorias organizam todas as movimentações
3. **User Isolation**: Todos os dados são isolados por usuário (`userId`)
4. **Automatic Triggers**: Sistema de notificações e atualizações automáticas
5. **Real-time Updates**: Dashboard, Reports e Trends refletem mudanças imediatamente
6. **Modular Integration**: Cada módulo pode funcionar independentemente, mas se beneficia da integração

### Benefícios da Arquitetura:

✅ **Consistência**: Dados sempre sincronizados entre módulos
✅ **Automação**: Reduz necessidade de intervenção manual
✅ **Insights**: Análises baseadas em dados agregados de múltiplas fontes
✅ **Escalabilidade**: Fácil adicionar novos módulos que se integram ao Transaction
✅ **Manutenibilidade**: Separação clara de responsabilidades

---

**Última atualização**: Janeiro 2025
**Versão do Sistema**: 1.0.0

