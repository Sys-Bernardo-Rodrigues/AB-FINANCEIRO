# Exemplos de Integração

Exemplos práticos de como integrar o frontend com a API do AB Financeiro.

## Configuração Inicial

### Setup do Cliente HTTP

```typescript
// utils/api.ts
const API_BASE = '/api'

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Importante: inclui cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Redirecionar para login
      window.location.href = '/login'
      throw new Error('Não autenticado')
    }

    const error = await response.json()
    throw new Error(error.error || 'Erro na requisição')
  }

  return response.json()
}
```

---

## Autenticação

### Login

```typescript
interface LoginData {
  email: string
  password: string
}

interface User {
  id: string
  name: string
  email: string
}

async function login(data: LoginData): Promise<User> {
  const response = await apiRequest<{ user: User; token: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )

  // Cookie é definido automaticamente pelo servidor
  return response.user
}

// Uso
try {
  const user = await login({
    email: 'usuario@email.com',
    password: 'senha123'
  })
  console.log('Login realizado:', user)
  // Redirecionar para dashboard
  window.location.href = '/'
} catch (error) {
  console.error('Erro no login:', error)
  // Exibir mensagem de erro
}
```

### Verificar Autenticação

```typescript
async function checkAuth(): Promise<User | null> {
  try {
    const response = await apiRequest<{ user: User }>('/auth/me')
    return response.user
  } catch (error) {
    return null
  }
}

// Uso em componente React
useEffect(() => {
  checkAuth().then(user => {
    if (user) {
      setUser(user)
    } else {
      router.push('/login')
    }
  })
}, [])
```

### Logout

```typescript
async function logout(): Promise<void> {
  await apiRequest('/auth/logout', {
    method: 'POST',
  })
  // Redirecionar para login
  window.location.href = '/login'
}
```

---

## Transações

### Listar Transações

```typescript
interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    id: string
    name: string
    type: 'INCOME' | 'EXPENSE'
  }
  date: string
  creditCardId?: string
  receipts: any[]
}

interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
}

async function getTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.categoryId) params.append('categoryId', filters.categoryId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.search) params.append('search', filters.search)
  if (filters.limit) params.append('limit', filters.limit.toString())

  return apiRequest<Transaction[]>(`/transactions?${params.toString()}`)
}

// Uso
const transactions = await getTransactions({
  type: 'EXPENSE',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  limit: 50
})
```

### Criar Transação

```typescript
interface CreateTransactionData {
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryId: string
  date: string // ISO string
  creditCardId?: string
  planId?: string
  isScheduled?: boolean
  scheduledDate?: string
}

async function createTransaction(
  data: CreateTransactionData
): Promise<Transaction> {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Uso
const transaction = await createTransaction({
  description: 'Compra no supermercado',
  amount: 150.50,
  type: 'EXPENSE',
  categoryId: 'uuid-da-categoria',
  date: new Date().toISOString(),
})
```

### Atualizar Transação

```typescript
async function updateTransaction(
  id: string,
  data: Partial<CreateTransactionData>
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
```

### Deletar Transação

```typescript
async function deleteTransaction(id: string): Promise<void> {
  await apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  })
}
```

---

## Dashboard

### Obter Dados do Dashboard

```typescript
interface DashboardData {
  balance: number
  income: number
  expenses: number
  recentTransactions: Transaction[]
  month: number
  year: number
  daysInMonth: number
  daysRemainingInMonth: number
  avgDailyIncome: number
  avgDailyExpense: number
  previousMonth: {
    income: number
    expenses: number
  }
  variations: {
    income: number
    expense: number
  }
  metrics: {
    maxIncome: number
    maxExpense: number
    savingsRate: number
    averageBalance: number
    mostUsedCategory: string
    daysUntilZero: number | null
    totalTransactions: number
    incomeCount: number
    expenseCount: number
  }
}

async function getDashboard(
  month?: number,
  year?: number
): Promise<DashboardData> {
  const params = new URLSearchParams()
  if (month) params.append('month', month.toString())
  if (year) params.append('year', year.toString())

  return apiRequest<DashboardData>(`/dashboard?${params.toString()}`)
}

// Uso
const dashboard = await getDashboard(1, 2026)
console.log('Saldo:', dashboard.balance)
console.log('Receitas:', dashboard.income)
console.log('Despesas:', dashboard.expenses)
```

---

## Categorias

### Listar Categorias

```typescript
interface Category {
  id: string
  name: string
  description?: string
  type: 'INCOME' | 'EXPENSE'
  userId: string
  createdAt: string
  updatedAt: string
}

async function getCategories(
  type?: 'INCOME' | 'EXPENSE'
): Promise<Category[]> {
  const params = type ? `?type=${type}` : ''
  return apiRequest<Category[]>(`/categories${params}`)
}
```

### Criar Categoria

```typescript
async function createCategory(data: {
  name: string
  description?: string
  type: 'INCOME' | 'EXPENSE'
}): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

---

## Grupos de Família

### Listar Grupos

```typescript
interface FamilyGroup {
  id: string
  name: string
  description?: string
  createdBy: string
  role: 'ADMIN' | 'MEMBER'
  members: {
    id: string
    userId: string
    userName: string
    userEmail: string
    role: 'ADMIN' | 'MEMBER'
    joinedAt: string
  }[]
  createdAt: string
  updatedAt: string
}

async function getFamilyGroups(): Promise<FamilyGroup[]> {
  return apiRequest<FamilyGroup[]>('/family-groups')
}
```

### Criar Grupo

```typescript
async function createFamilyGroup(data: {
  name: string
  description?: string
}): Promise<FamilyGroup> {
  return apiRequest<FamilyGroup>('/family-groups', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Uso
const group = await createFamilyGroup({
  name: 'Família Silva',
  description: 'Grupo da família'
})
// Criador é automaticamente adicionado como ADMIN
```

### Adicionar Membro

```typescript
async function addFamilyGroupMember(
  groupId: string,
  userEmail: string
): Promise<FamilyGroupMember> {
  return apiRequest<FamilyGroupMember>(
    `/family-groups/${groupId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ userEmail }),
    }
  )
}
```

### Remover Membro

```typescript
async function removeFamilyGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  await apiRequest(`/family-groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  })
}
```

---

## Componente React Completo

### Hook de Autenticação

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao fazer login')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
    router.push('/login')
  }

  return { user, loading, login, logout, checkAuth }
}
```

### Componente de Lista de Transações

```typescript
// components/TransactionList.tsx
'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: { name: string }
  date: string
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transactions?limit=50', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar transações')
      }

      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Transações</h2>
      {transactions.map(transaction => (
        <div key={transaction.id}>
          <h3>{transaction.description}</h3>
          <p>
            {transaction.type === 'INCOME' ? '+' : '-'}
            R$ {transaction.amount.toFixed(2)}
          </p>
          <p>{transaction.category.name}</p>
          <p>{new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
```

### Componente de Formulário de Transação

```typescript
// components/TransactionForm.tsx
'use client'

import { useState } from 'react'

export function TransactionForm() {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar transação')
      }

      // Sucesso - limpar formulário ou redirecionar
      setFormData({
        description: '',
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
      })
      alert('Transação criada com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <input
        type="text"
        placeholder="Descrição"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        required
      />
      
      <input
        type="number"
        step="0.01"
        placeholder="Valor"
        value={formData.amount}
        onChange={e => setFormData({ ...formData, amount: e.target.value })}
        required
      />
      
      <select
        value={formData.type}
        onChange={e => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
      >
        <option value="EXPENSE">Despesa</option>
        <option value="INCOME">Receita</option>
      </select>
      
      <input
        type="date"
        value={formData.date}
        onChange={e => setFormData({ ...formData, date: e.target.value })}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Criar Transação'}
      </button>
    </form>
  )
}
```

---

## Tratamento de Erros Global

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any, router: any) {
  if (error.message.includes('401') || error.message.includes('Não autenticado')) {
    router.push('/login')
    return
  }

  if (error.message.includes('403')) {
    alert('Você não tem permissão para esta ação')
    return
  }

  if (error.message.includes('404')) {
    alert('Recurso não encontrado')
    return
  }

  alert(error.message || 'Erro desconhecido')
}
```

---

## Formatação de Valores

```typescript
// utils/format.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

// Uso
formatCurrency(1500.50) // "R$ 1.500,50"
formatDate('2026-01-05') // "05/01/2026"
```

---

Estes exemplos cobrem os principais casos de uso. Adapte conforme necessário para seu framework frontend específico.


