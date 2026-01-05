# Documentação Completa das APIs

Esta documentação detalha todas as rotas de API disponíveis no sistema AB Financeiro.

## Base URL

Todas as APIs estão disponíveis em `/api/*`

## Autenticação

Todas as rotas (exceto `/api/auth/*`) requerem autenticação via cookie `token`.

---

## 🔐 Autenticação

### POST /api/auth/login

Fazer login no sistema.

**Request Body**:
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response 200 OK**:
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com"
  },
  "token": "jwt_token"
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Email ou senha inválidos"
}
```

---

### GET /api/auth/me

Verificar autenticação atual do usuário.

**Headers**: Cookie `token` (automático)

**Response 200 OK**:
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com"
  }
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Não autenticado"
}
```

---

### POST /api/auth/logout

Fazer logout do sistema.

**Response 200 OK**:
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## 💰 Transações

### GET /api/transactions

Listar transações do usuário (ou grupo de família).

**Query Parameters**:
- `type` (opcional): `INCOME` ou `EXPENSE`
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `search` (opcional): Buscar por descrição
- `categoryId` (opcional): Filtrar por categoria
- `startDate` (opcional): Data inicial (ISO string)
- `endDate` (opcional): Data final (ISO string)
- `minAmount` (opcional): Valor mínimo
- `maxAmount` (opcional): Valor máximo
- `allUsers` (opcional): `true` para buscar de todos os usuários (admin)

**Response 200 OK**:
```json
[
  {
    "id": "uuid",
    "description": "Compra no supermercado",
    "amount": 150.50,
    "type": "EXPENSE",
    "category": {
      "id": "uuid",
      "name": "Alimentação",
      "type": "EXPENSE"
    },
    "userId": "uuid",
    "date": "2026-01-05T10:00:00.000Z",
    "isInstallment": false,
    "isScheduled": false,
    "creditCardId": null,
    "planId": null,
    "receipts": [],
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
]
```

**Nota**: Se o usuário estiver em um grupo de família, retorna transações de todos os membros.

---

### POST /api/transactions

Criar nova transação.

**Request Body**:
```json
{
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "EXPENSE",
  "categoryId": "uuid",
  "date": "2026-01-05T10:00:00.000Z",
  "creditCardId": "uuid", // Opcional
  "planId": "uuid", // Opcional
  "installmentId": "uuid", // Opcional
  "isScheduled": false, // Opcional
  "scheduledDate": "2026-01-10T10:00:00.000Z" // Opcional, se isScheduled = true
}
```

**Response 201 Created**:
```json
{
  "id": "uuid",
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "EXPENSE",
  "category": { ... },
  "userId": "uuid",
  "date": "2026-01-05T10:00:00.000Z",
  ...
}
```

**Response 400 Bad Request**:
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "field": "amount",
      "message": "Amount deve ser um número positivo"
    }
  ]
}
```

---

### GET /api/transactions/[id]

Obter transação específica.

**Response 200 OK**:
```json
{
  "id": "uuid",
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "EXPENSE",
  "category": { ... },
  "receipts": [ ... ],
  ...
}
```

**Response 404 Not Found**:
```json
{
  "error": "Transação não encontrada"
}
```

---

### PUT /api/transactions/[id]

Atualizar transação.

**Request Body**: Mesmo formato do POST, mas todos os campos são opcionais.

**Response 200 OK**: Transação atualizada

---

### DELETE /api/transactions/[id]

Deletar transação.

**Response 200 OK**:
```json
{
  "message": "Transação deletada com sucesso"
}
```

---

### GET /api/transactions/calendar

Obter transações em formato de calendário.

**Query Parameters**:
- `month` (opcional): Mês (1-12)
- `year` (opcional): Ano

**Response 200 OK**:
```json
{
  "2026-01-05": [
    {
      "id": "uuid",
      "description": "Compra",
      "amount": 150.50,
      "type": "EXPENSE",
      ...
    }
  ],
  "2026-01-06": [ ... ]
}
```

---

### GET /api/transactions/scheduled

Obter transações agendadas.

**Query Parameters**:
- `status` (opcional): `PENDING` ou `COMPLETED`
- `limit` (opcional): Número máximo de resultados

**Response 200 OK**: Array de transações agendadas

---

## 📁 Categorias

### GET /api/categories

Listar categorias do usuário.

**Query Parameters**:
- `type` (opcional): `INCOME` ou `EXPENSE`

**Response 200 OK**:
```json
[
  {
    "id": "uuid",
    "name": "Alimentação",
    "description": "Gastos com comida",
    "type": "EXPENSE",
    "userId": "uuid",
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
]
```

---

### POST /api/categories

Criar nova categoria.

**Request Body**:
```json
{
  "name": "Alimentação",
  "description": "Gastos com comida",
  "type": "EXPENSE"
}
```

**Response 201 Created**: Categoria criada

---

### GET /api/categories/[id]

Obter categoria específica.

**Response 200 OK**: Categoria

---

### PUT /api/categories/[id]

Atualizar categoria.

**Request Body**: Mesmo formato do POST

**Response 200 OK**: Categoria atualizada

---

### DELETE /api/categories/[id]

Deletar categoria.

**Response 200 OK**:
```json
{
  "message": "Categoria deletada com sucesso"
}
```

---

### GET /api/categories/insights

Obter insights das categorias.

**Query Parameters**:
- `month` (opcional): Mês
- `year` (opcional): Ano

**Response 200 OK**:
```json
[
  {
    "category": {
      "id": "uuid",
      "name": "Alimentação",
      "type": "EXPENSE"
    },
    "total": 1500.00,
    "count": 10,
    "percentage": 45.5
  }
]
```

---

## 📊 Dashboard

### GET /api/dashboard

Obter dados do dashboard.

**Query Parameters**:
- `month` (opcional): Mês (1-12, padrão: mês atual)
- `year` (opcional): Ano (padrão: ano atual)

**Response 200 OK**:
```json
{
  "balance": 5000.00,
  "income": 10000.00,
  "expenses": 5000.00,
  "recentTransactions": [ ... ],
  "month": 1,
  "year": 2026,
  "daysInMonth": 31,
  "daysRemainingInMonth": 26,
  "avgDailyIncome": 322.58,
  "avgDailyExpense": 161.29,
  "previousMonth": {
    "income": 9500.00,
    "expenses": 4800.00
  },
  "variations": {
    "income": 5.26,
    "expense": 4.17
  },
  "metrics": {
    "maxIncome": 5000.00,
    "maxExpense": 2000.00,
    "savingsRate": 50.0,
    "averageBalance": 4500.00,
    "mostUsedCategory": "Alimentação",
    "daysUntilZero": 31,
    "totalTransactions": 50,
    "incomeCount": 10,
    "expenseCount": 40
  }
}
```

**Nota**: Se o usuário estiver em um grupo de família, os dados são consolidados de todos os membros.

---

## 👨‍👩‍👧‍👦 Grupos de Família

### GET /api/family-groups

Listar grupos de família do usuário.

**Response 200 OK**:
```json
[
  {
    "id": "uuid",
    "name": "Família Silva",
    "description": "Grupo da família",
    "createdBy": "uuid",
    "role": "ADMIN",
    "members": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userName": "João Silva",
        "userEmail": "joao@email.com",
        "role": "ADMIN",
        "joinedAt": "2026-01-05T10:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
]
```

---

### POST /api/family-groups

Criar novo grupo de família.

**Request Body**:
```json
{
  "name": "Família Silva",
  "description": "Grupo da família"
}
```

**Response 201 Created**: Grupo criado (o criador é automaticamente adicionado como ADMIN)

---

### GET /api/family-groups/[id]

Obter grupo específico.

**Response 200 OK**: Grupo com todos os membros

**Response 404 Not Found**:
```json
{
  "error": "Grupo não encontrado ou você não é membro"
}
```

---

### PUT /api/family-groups/[id]

Atualizar grupo (apenas ADMIN).

**Request Body**:
```json
{
  "name": "Família Silva Atualizada",
  "description": "Nova descrição"
}
```

**Response 200 OK**: Grupo atualizado

**Response 403 Forbidden**:
```json
{
  "error": "Você não tem permissão para editar este grupo"
}
```

---

### DELETE /api/family-groups/[id]

Deletar grupo (apenas ADMIN).

**Response 200 OK**:
```json
{
  "message": "Grupo deletado com sucesso"
}
```

---

### POST /api/family-groups/[id]/members

Adicionar membro ao grupo (apenas ADMIN).

**Request Body**:
```json
{
  "userEmail": "novo@email.com"
}
```

**Response 201 Created**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "userName": "Novo Membro",
  "userEmail": "novo@email.com",
  "role": "MEMBER",
  "joinedAt": "2026-01-05T10:00:00.000Z"
}
```

**Response 404 Not Found**:
```json
{
  "error": "Usuário não encontrado"
}
```

**Response 400 Bad Request**:
```json
{
  "error": "Usuário já é membro deste grupo"
}
```

---

### DELETE /api/family-groups/[id]/members/[userId]

Remover membro do grupo.

- ADMIN pode remover qualquer membro (exceto o último admin)
- MEMBER pode remover apenas a si mesmo

**Response 200 OK**:
```json
{
  "message": "Membro removido com sucesso"
}
```

**Response 400 Bad Request**:
```json
{
  "error": "Não é possível remover o último administrador do grupo"
}
```

---

## 📈 Relatórios

### GET /api/reports

Gerar relatório financeiro.

**Query Parameters**:
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `type` (opcional): `INCOME`, `EXPENSE` ou ambos

**Response 200 OK**:
```json
{
  "totalIncome": 10000.00,
  "totalExpenses": 5000.00,
  "balance": 5000.00,
  "byCategory": [ ... ],
  "byMonth": [ ... ],
  "trends": [ ... ]
}
```

---

## 🔔 Notificações

### GET /api/notifications

Listar notificações do usuário.

**Query Parameters**:
- `status` (opcional): `UNREAD`, `READ` ou `ARCHIVED`
- `limit` (opcional): Número máximo de resultados

**Response 200 OK**: Array de notificações

---

### PUT /api/notifications/[id]

Marcar notificação como lida.

**Response 200 OK**: Notificação atualizada

---

### POST /api/notifications/mark-all-read

Marcar todas as notificações como lidas.

**Response 200 OK**:
```json
{
  "message": "Todas as notificações foram marcadas como lidas"
}
```

---

## 💳 Cartões de Crédito

### GET /api/credit-cards

Listar cartões de crédito do usuário.

**Response 200 OK**: Array de cartões

---

### POST /api/credit-cards

Criar novo cartão de crédito.

**Request Body**:
```json
{
  "name": "Cartão Nubank",
  "limit": 5000.00,
  "paymentDay": 10
}
```

**Response 201 Created**: Cartão criado

---

## 📦 Parcelamentos

### GET /api/installments

Listar parcelamentos.

**Query Parameters**:
- `status` (opcional): `ACTIVE`, `COMPLETED` ou `CANCELLED`

**Response 200 OK**: Array de parcelamentos

---

## 🎯 Planejamentos

### GET /api/plans

Listar planejamentos.

**Query Parameters**:
- `status` (opcional): `ACTIVE`, `COMPLETED` ou `CANCELLED`

**Response 200 OK**: Array de planejamentos

---

## 💾 Metas de Economia

### GET /api/savings-goals

Listar metas de economia.

**Query Parameters**:
- `status` (opcional): `ACTIVE`, `COMPLETED` ou `CANCELLED`

**Response 200 OK**: Array de metas

---

## 📎 Comprovantes

### POST /api/receipts

Upload de comprovante.

**Request**: FormData com arquivo

**Response 201 Created**: Comprovante criado

---

### GET /api/receipts/[id]

Download de comprovante.

**Response**: Arquivo do comprovante

---

## 🔄 Transações Recorrentes

### GET /api/recurring-transactions

Listar transações recorrentes.

**Query Parameters**:
- `isActive` (opcional): `true` ou `false`

**Response 200 OK**: Array de transações recorrentes

---

## 📊 Tendências

### GET /api/trends

Obter análise de tendências.

**Query Parameters**:
- `period` (opcional): `MONTH`, `QUARTER` ou `YEAR`

**Response 200 OK**: Dados de tendências

---

## 👥 Usuários (Admin)

### GET /api/users

Listar todos os usuários (apenas admin).

**Response 200 OK**: Array de usuários

---

### POST /api/users

Criar novo usuário (apenas admin).

**Request Body**:
```json
{
  "name": "Novo Usuário",
  "email": "novo@email.com",
  "password": "senha123"
}
```

**Response 201 Created**: Usuário criado

---

## ⚠️ Tratamento de Erros

Todas as APIs retornam erros no formato:

```json
{
  "error": "Mensagem de erro",
  "details": [] // Opcional, para erros de validação
}
```

### Códigos de Status Comuns

- **200 OK**: Sucesso
- **201 Created**: Recurso criado
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Não autenticado
- **403 Forbidden**: Sem permissão
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro do servidor

