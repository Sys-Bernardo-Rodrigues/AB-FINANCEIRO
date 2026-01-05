# Documentação do Sistema AB Financeiro

Bem-vindo à documentação completa do sistema AB Financeiro. Esta documentação foi criada para ajudar desenvolvedores frontend a entenderem como o sistema funciona e como integrar com a API.

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Grupos de Família](#grupos-de-família)
6. [Fluxos Principais](#fluxos-principais)
7. [Exemplos de Integração](#exemplos-de-integração)
8. [Tratamento de Erros](#tratamento-de-erros)

## Visão Geral

O AB Financeiro é um sistema de controle financeiro pessoal e familiar que permite:

- Gerenciar transações financeiras (receitas e despesas)
- Controlar parcelamentos
- Planejar gastos
- Definir metas de economia
- Gerenciar cartões de crédito
- Compartilhar dados com grupos de família
- Receber notificações sobre finanças
- Anexar comprovantes às transações

### Tecnologias Utilizadas

- **Backend**: Next.js 14 (API Routes)
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT (JSON Web Tokens) via cookies HTTP-only
- **Cache**: Redis

## Autenticação

### Fluxo de Autenticação

O sistema utiliza autenticação baseada em JWT armazenado em cookies HTTP-only.

#### 1. Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200 OK)**:
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

**Cookie Setado**: `token` (HTTP-only, Secure, SameSite=Lax)

#### 2. Verificar Autenticação

**Endpoint**: `GET /api/auth/me`

**Headers**: Cookie com `token` (automático)

**Response (200 OK)**:
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Não autenticado"
}
```

#### 3. Logout

**Endpoint**: `POST /api/auth/logout`

**Response (200 OK)**:
```json
{
  "message": "Logout realizado com sucesso"
}
```

**Cookie Removido**: `token`

### Middleware de Autenticação

O sistema possui um middleware que:
- Redireciona usuários não autenticados para `/login`
- Permite acesso público apenas em `/login` e `/register`
- Todas as outras rotas requerem autenticação

### Headers Necessários

Para todas as requisições autenticadas, o cookie `token` é enviado automaticamente pelo navegador. Não é necessário enviar headers manuais.

**Importante**: Use `credentials: 'include'` nas requisições fetch:

```javascript
fetch('/api/transactions', {
  credentials: 'include'
})
```

## Estrutura de Dados

### Modelos Principais

#### User (Usuário)
```typescript
{
  id: string
  name: string
  email: string
  password: string (não retornado nas APIs)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Transaction (Transação)
```typescript
{
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryId: string
  category: Category
  userId: string
  date: DateTime
  isInstallment: boolean
  installmentId?: string
  isScheduled: boolean
  scheduledDate?: DateTime
  planId?: string
  creditCardId?: string
  receipts: Receipt[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Category (Categoria)
```typescript
{
  id: string
  name: string
  description?: string
  type: 'INCOME' | 'EXPENSE'
  userId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### FamilyGroup (Grupo de Família)
```typescript
{
  id: string
  name: string
  description?: string
  createdBy: string
  role: 'ADMIN' | 'MEMBER' // Role do usuário atual no grupo
  members: FamilyGroupMember[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### FamilyGroupMember (Membro do Grupo)
```typescript
{
  id: string
  userId: string
  userName: string
  userEmail: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: DateTime
}
```

Veja [MODELS.md](./MODELS.md) para documentação completa de todos os modelos.

## APIs Disponíveis

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/register` - Criar conta (desabilitado)
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Verificar autenticação atual

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/[id]` - Obter transação específica
- `PUT /api/transactions/[id]` - Atualizar transação
- `DELETE /api/transactions/[id]` - Deletar transação
- `GET /api/transactions/calendar` - Obter transações em formato de calendário
- `GET /api/transactions/scheduled` - Obter transações agendadas

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `GET /api/categories/[id]` - Obter categoria específica
- `PUT /api/categories/[id]` - Atualizar categoria
- `DELETE /api/categories/[id]` - Deletar categoria
- `GET /api/categories/insights` - Obter insights das categorias

### Dashboard
- `GET /api/dashboard` - Obter dados do dashboard

### Grupos de Família
- `GET /api/family-groups` - Listar grupos do usuário
- `POST /api/family-groups` - Criar grupo
- `GET /api/family-groups/[id]` - Obter grupo específico
- `PUT /api/family-groups/[id]` - Atualizar grupo (apenas admin)
- `DELETE /api/family-groups/[id]` - Deletar grupo (apenas admin)
- `POST /api/family-groups/[id]/members` - Adicionar membro (apenas admin)
- `DELETE /api/family-groups/[id]/members/[userId]` - Remover membro

Veja [API.md](./API.md) para documentação detalhada de todas as APIs.

## Grupos de Família

### Conceito

Grupos de família permitem que múltiplos usuários compartilhem informações financeiras. Quando usuários estão no mesmo grupo:

- **Todas as transações** são visíveis para todos os membros
- **Dashboard** mostra dados consolidados de todos os membros
- **Relatórios** incluem dados de todos os membros
- **Categorias** permanecem individuais (cada usuário tem suas próprias)

### Papéis

- **ADMIN**: Pode editar grupo, adicionar/remover membros, deletar grupo
- **MEMBER**: Pode visualizar dados compartilhados, sair do grupo

### Compartilhamento Automático

O sistema automaticamente busca dados de todos os membros do grupo quando:
- Buscar transações
- Calcular dashboard
- Gerar relatórios
- Visualizar tendências

**Importante**: Não é necessário fazer requisições especiais. O sistema detecta automaticamente os grupos do usuário e inclui os dados.

## Fluxos Principais

### 1. Fluxo de Login

```
1. Usuário preenche email e senha
2. POST /api/auth/login
3. Sistema valida credenciais
4. Gera JWT token
5. Define cookie HTTP-only
6. Retorna dados do usuário
7. Frontend redireciona para dashboard
```

### 2. Fluxo de Criação de Transação

```
1. Usuário preenche formulário
2. POST /api/transactions
   Body: {
     description, amount, type, categoryId, date, etc.
   }
3. Sistema valida dados
4. Cria transação associada ao usuário (ou grupo)
5. Retorna transação criada
6. Frontend atualiza lista
```

### 3. Fluxo de Dashboard

```
1. GET /api/dashboard?month=1&year=2026
2. Sistema busca transações do mês
   - Se usuário está em grupo: busca de todos os membros
   - Se não: busca apenas do usuário
3. Calcula totais, médias, métricas
4. Retorna dados consolidados
5. Frontend exibe cards e gráficos
```

### 4. Fluxo de Grupo de Família

```
1. Admin cria grupo: POST /api/family-groups
2. Admin adiciona membros: POST /api/family-groups/[id]/members
   Body: { userEmail: "email@exemplo.com" }
3. Membros recebem acesso automático
4. Dados são compartilhados automaticamente
```

Veja [FLOWS.md](./FLOWS.md) para fluxos detalhados.

## Exemplos de Integração

### Exemplo 1: Buscar Transações

```javascript
async function fetchTransactions() {
  const response = await fetch('/api/transactions?limit=50', {
    credentials: 'include'
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirecionar para login
      window.location.href = '/login'
      return
    }
    throw new Error('Erro ao buscar transações')
  }
  
  const transactions = await response.json()
  return transactions
}
```

### Exemplo 2: Criar Transação

```javascript
async function createTransaction(data) {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      description: data.description,
      amount: parseFloat(data.amount),
      type: data.type, // 'INCOME' ou 'EXPENSE'
      categoryId: data.categoryId,
      date: data.date, // ISO string
      creditCardId: data.creditCardId || null,
      planId: data.planId || null
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao criar transação')
  }
  
  return await response.json()
}
```

### Exemplo 3: Verificar Autenticação

```javascript
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    
    return null
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return null
  }
}
```

### Exemplo 4: Criar Grupo de Família

```javascript
async function createFamilyGroup(name, description) {
  const response = await fetch('/api/family-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      name,
      description
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao criar grupo')
  }
  
  return await response.json()
}
```

Veja [EXAMPLES.md](./EXAMPLES.md) para mais exemplos.

## Tratamento de Erros

### Códigos de Status HTTP

- **200 OK**: Sucesso
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Não autenticado
- **403 Forbidden**: Sem permissão
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro do servidor

### Formato de Erro

Todas as respostas de erro seguem o formato:

```json
{
  "error": "Mensagem de erro",
  "details": [] // Opcional, para erros de validação
}
```

### Exemplo de Tratamento

```javascript
async function handleRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    })
    
    if (!response.ok) {
      const error = await response.json()
      
      switch (response.status) {
        case 401:
          // Redirecionar para login
          window.location.href = '/login'
          break
        case 403:
          alert('Você não tem permissão para esta ação')
          break
        case 404:
          alert('Recurso não encontrado')
          break
        default:
          alert(error.error || 'Erro desconhecido')
      }
      
      throw new Error(error.error)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro na requisição:', error)
    throw error
  }
}
```

## Próximos Passos

1. Leia [API.md](./API.md) para detalhes completos das APIs
2. Consulte [MODELS.md](./MODELS.md) para entender os modelos de dados
3. Veja [FLOWS.md](./FLOWS.md) para fluxos detalhados
4. Explore [EXAMPLES.md](./EXAMPLES.md) para exemplos práticos

## Suporte

Para dúvidas ou problemas, consulte a documentação específica ou entre em contato com a equipe de desenvolvimento.

