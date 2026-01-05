# Modelos de Dados

Documentação completa de todos os modelos de dados do sistema AB Financeiro.

## User (Usuário)

Representa um usuário do sistema.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome completo
  email: string                 // Email único
  password: string              // Hash da senha (nunca retornado nas APIs)
  createdAt: DateTime          // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Relações**:
- Possui muitas transações
- Possui muitas categorias
- Possui muitos parcelamentos
- Possui muitos planejamentos
- Pode estar em múltiplos grupos de família

---

## Transaction (Transação)

Representa uma transação financeira (receita ou despesa).

```typescript
{
  id: string                    // UUID
  description: string            // Descrição da transação
  amount: number                // Valor (sempre positivo)
  type: 'INCOME' | 'EXPENSE'    // Tipo: receita ou despesa
  categoryId: string            // ID da categoria
  category: Category            // Objeto categoria (populado em queries)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado em queries)
  date: DateTime                // Data da transação
  isInstallment: boolean        // Se faz parte de um parcelamento
  installmentId?: string        // ID do parcelamento (se aplicável)
  installment?: Installment     // Objeto parcelamento (populado)
  isScheduled: boolean          // Se está agendada
  scheduledDate?: DateTime      // Data agendada (se isScheduled = true)
  planId?: string               // ID do planejamento (se aplicável)
  plan?: Plan                   // Objeto planejamento (populado)
  creditCardId?: string         // ID do cartão de crédito (se aplicável)
  creditCard?: CreditCard       // Objeto cartão (populado)
  receipts: Receipt[]            // Array de comprovantes
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- `amount` é sempre positivo
- `type` determina se é receita ou despesa
- Se `isScheduled = true`, a transação só é processada na `scheduledDate`
- Se `isInstallment = true`, a transação faz parte de um parcelamento

---

## Category (Categoria)

Categoriza transações por tipo.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome da categoria
  description?: string          // Descrição opcional
  type: 'INCOME' | 'EXPENSE'   // Tipo: receita ou despesa
  userId: string                // ID do usuário (categorias são individuais)
  user: User                    // Objeto usuário (populado)
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Relações**:
- Possui muitas transações
- Possui muitos parcelamentos
- Possui muitos planejamentos
- Possui muitas transações recorrentes

**Regras de Negócio**:
- Categorias são individuais por usuário (não compartilhadas em grupos)
- Nome deve ser único por usuário e tipo
- Não pode ser deletada se tiver transações associadas

---

## FamilyGroup (Grupo de Família)

Representa um grupo de família para compartilhamento de dados.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome do grupo
  description?: string          // Descrição opcional
  createdBy: string            // ID do usuário que criou
  createdAt: DateTime          // Data de criação
  updatedAt: DateTime          // Data de última atualização
  members: FamilyGroupMember[] // Array de membros
}
```

**Relações**:
- Possui muitos membros (FamilyGroupMember)

**Regras de Negócio**:
- Criador é automaticamente ADMIN
- Deve ter pelo menos um ADMIN
- Quando deletado, remove todos os membros

---

## FamilyGroupMember (Membro do Grupo)

Representa a relação entre usuário e grupo de família.

```typescript
{
  id: string                    // UUID
  familyGroupId: string         // ID do grupo
  familyGroup: FamilyGroup      // Objeto grupo (populado)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  role: 'ADMIN' | 'MEMBER'      // Papel no grupo
  joinedAt: DateTime           // Data de entrada no grupo
}
```

**Relações**:
- Pertence a um FamilyGroup
- Pertence a um User

**Regras de Negócio**:
- Usuário não pode estar no mesmo grupo duas vezes
- ADMIN pode gerenciar o grupo
- MEMBER pode apenas visualizar dados compartilhados

---

## Installment (Parcelamento)

Representa uma compra parcelada.

```typescript
{
  id: string                    // UUID
  description: string            // Descrição do parcelamento
  totalAmount: number           // Valor total
  installments: number          // Número de parcelas
  currentInstallment: number    // Parcela atual (começa em 1)
  categoryId: string            // ID da categoria
  category: Category            // Objeto categoria (populado)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  creditCardId?: string         // ID do cartão (se aplicável)
  creditCard?: CreditCard       // Objeto cartão (populado)
  startDate: DateTime           // Data de início
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  transactions: Transaction[]   // Transações geradas
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- Gera transações automaticamente conforme parcelas
- `currentInstallment` incrementa quando parcela é paga
- Status muda para COMPLETED quando todas as parcelas são pagas

---

## Plan (Planejamento)

Representa um planejamento financeiro.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome do planejamento
  description?: string          // Descrição opcional
  targetAmount: number          // Valor alvo
  currentAmount: number         // Valor atual (soma das transações)
  startDate: DateTime           // Data de início
  endDate: DateTime            // Data de término
  categoryId: string            // ID da categoria
  category: Category            // Objeto categoria (populado)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  transactions: Transaction[]   // Transações associadas
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- `currentAmount` é calculado automaticamente
- Status muda para COMPLETED quando `currentAmount >= targetAmount`
- Transações associadas incrementam `currentAmount`

---

## RecurringTransaction (Transação Recorrente)

Representa uma transação que se repete periodicamente.

```typescript
{
  id: string                    // UUID
  description: string            // Descrição
  amount: number                // Valor
  type: 'INCOME' | 'EXPENSE'    // Tipo
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'
  startDate: DateTime           // Data de início
  endDate?: DateTime            // Data de término (opcional)
  nextDueDate: DateTime         // Próxima data de vencimento
  categoryId: string            // ID da categoria
  category: Category            // Objeto categoria (populado)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  creditCardId?: string         // ID do cartão (se aplicável)
  creditCard?: CreditCard       // Objeto cartão (populado)
  isActive: boolean            // Se está ativa
  lastExecuted?: DateTime      // Última execução
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- Sistema processa automaticamente quando `nextDueDate` chega
- Gera transação quando processada
- `nextDueDate` é atualizado automaticamente após processamento

---

## SavingsGoal (Meta de Economia)

Representa uma meta de economia.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome da meta
  description?: string          // Descrição opcional
  targetAmount: number          // Valor alvo
  currentAmount: number         // Valor atual
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  startDate: DateTime           // Data de início
  endDate: DateTime             // Data de término
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- `currentAmount` é atualizado manualmente ou por transações
- Status muda para COMPLETED quando `currentAmount >= targetAmount`

---

## CreditCard (Cartão de Crédito)

Representa um cartão de crédito.

```typescript
{
  id: string                    // UUID
  name: string                  // Nome do cartão
  limit: number                 // Limite do cartão
  paymentDay: number            // Dia do mês para pagamento (1-31)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  transactions: Transaction[]   // Transações no cartão
  installments: Installment[]   // Parcelamentos no cartão
  recurringTransactions: RecurringTransaction[] // Recorrentes no cartão
  createdAt: DateTime           // Data de criação
  updatedAt: DateTime           // Data de última atualização
}
```

**Regras de Negócio**:
- `paymentDay` determina quando o cartão deve ser pago
- Transações no cartão não afetam saldo imediatamente

---

## Notification (Notificação)

Representa uma notificação do sistema.

```typescript
{
  id: string                    // UUID
  title: string                 // Título
  message: string                // Mensagem
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  relatedId?: string            // ID do recurso relacionado
  relatedType?: string          // Tipo do recurso relacionado
  actionUrl?: string            // URL de ação (opcional)
  createdAt: DateTime           // Data de criação
  readAt?: DateTime             // Data de leitura
}
```

**Regras de Negócio**:
- Criadas automaticamente pelo sistema
- Status muda para READ quando visualizada
- Podem ser arquivadas

---

## Receipt (Comprovante)

Representa um comprovante anexado a uma transação.

```typescript
{
  id: string                    // UUID
  filename: string              // Nome do arquivo no servidor
  originalFilename: string      // Nome original do arquivo
  url: string                   // URL para download
  mimeType: string              // Tipo MIME do arquivo
  size: number                  // Tamanho em bytes
  transactionId?: string        // ID da transação (se aplicável)
  transaction?: Transaction     // Objeto transação (populado)
  userId: string                // ID do usuário
  user: User                    // Objeto usuário (populado)
  uploadedAt: DateTime          // Data de upload
}
```

**Regras de Negócio**:
- Pode estar associado a uma transação
- Suporta imagens e PDFs
- Armazenado no sistema de arquivos

---

## Enums

### TransactionType
```typescript
'INCOME'   // Receita
'EXPENSE'  // Despesa
```

### InstallmentStatus
```typescript
'ACTIVE'     // Ativo
'COMPLETED'  // Completo
'CANCELLED'  // Cancelado
```

### PlanStatus
```typescript
'ACTIVE'     // Ativo
'COMPLETED'  // Completo
'CANCELLED'  // Cancelado
```

### RecurrenceFrequency
```typescript
'DAILY'       // Diário
'WEEKLY'      // Semanal
'BIWEEKLY'    // Quinzenal
'MONTHLY'     // Mensal
'QUARTERLY'   // Trimestral
'SEMIANNUAL'  // Semestral
'YEARLY'      // Anual
```

### GoalStatus
```typescript
'ACTIVE'     // Ativo
'COMPLETED'  // Completo
'CANCELLED'  // Cancelado
```

### GoalPeriod
```typescript
'MONTHLY'   // Mensal
'QUARTERLY' // Trimestral
'YEARLY'    // Anual
'CUSTOM'    // Personalizado
```

### NotificationType
```typescript
'INFO'     // Informação
'WARNING'  // Aviso
'DANGER'   // Perigo
'SUCCESS'  // Sucesso
```

### NotificationStatus
```typescript
'UNREAD'   // Não lida
'READ'     // Lida
'ARCHIVED' // Arquivada
```

### FamilyRole
```typescript
'ADMIN'   // Administrador
'MEMBER'  // Membro
```

---

## Relacionamentos

### User
- `transactions`: Transaction[] (1:N)
- `categories`: Category[] (1:N)
- `installments`: Installment[] (1:N)
- `plans`: Plan[] (1:N)
- `recurringTransactions`: RecurringTransaction[] (1:N)
- `savingsGoals`: SavingsGoal[] (1:N)
- `notifications`: Notification[] (1:N)
- `receipts`: Receipt[] (1:N)
- `creditCards`: CreditCard[] (1:N)
- `familyGroups`: FamilyGroupMember[] (N:M via FamilyGroupMember)

### Transaction
- `category`: Category (N:1)
- `user`: User (N:1)
- `installment`: Installment (N:1, opcional)
- `plan`: Plan (N:1, opcional)
- `creditCard`: CreditCard (N:1, opcional)
- `receipts`: Receipt[] (1:N)

### FamilyGroup
- `members`: FamilyGroupMember[] (1:N)

### FamilyGroupMember
- `familyGroup`: FamilyGroup (N:1)
- `user`: User (N:1)

---

## Notas Importantes

1. **Compartilhamento em Grupos**: Quando usuários estão no mesmo grupo de família, transações, dashboard e relatórios são compartilhados automaticamente. Categorias permanecem individuais.

2. **Valores**: Todos os valores monetários são números decimais (float) e sempre positivos. O tipo (INCOME/EXPENSE) determina se é receita ou despesa.

3. **Datas**: Todas as datas são em formato ISO 8601 (DateTime).

4. **UUIDs**: Todos os IDs são UUIDs (strings).

5. **Soft Delete**: O sistema não possui soft delete. Quando um recurso é deletado, é removido permanentemente (exceto transações que podem ter restrições).






