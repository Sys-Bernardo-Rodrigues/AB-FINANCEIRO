'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CreditCard } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
}

interface CreditCardFormProps {
  creditCard?: {
    id: string
    name: string
    limit: number
    paymentDay: number
  }
  onSuccess?: () => void
}

export default function CreditCardForm({ creditCard, onSuccess }: CreditCardFormProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [name, setName] = useState(creditCard?.name || '')
  const [limit, setLimit] = useState(creditCard?.limit.toString() || '')
  const [paymentDay, setPaymentDay] = useState(creditCard?.paymentDay.toString() || '15')
  const [userId, setUserId] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Definir usuário atual como padrão
    if (currentUser && !userId) {
      setUserId(currentUser.id)
    }
  }, [currentUser, userId])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validações
    if (!name.trim()) {
      setError('Nome do cartão é obrigatório')
      setLoading(false)
      return
    }

    const limitNum = parseFloat(limit)
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Limite deve ser um valor positivo')
      setLoading(false)
      return
    }

    const paymentDayNum = parseInt(paymentDay, 10)
    if (isNaN(paymentDayNum) || paymentDayNum < 1 || paymentDayNum > 31) {
      setError('Dia de pagamento deve ser entre 1 e 31')
      setLoading(false)
      return
    }

    try {
      const url = creditCard 
        ? `/api/credit-cards/${creditCard.id}`
        : '/api/credit-cards'
      
      const method = creditCard ? 'PUT' : 'POST'

      const requestBody: any = {
        name: name.trim(),
        limit: limitNum,
        paymentDay: paymentDayNum,
      }

      // Só adicionar userId se for fornecido e não for vazio
      if (userId && userId.trim()) {
        requestBody.userId = userId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/credit-cards')
          router.refresh()
        }
      } else {
        const data = await response.json()
        let errorMessage = data.error || `Erro ao ${creditCard ? 'atualizar' : 'criar'} cartão de crédito`
        
        // Adicionar detalhes da validação se houver
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const firstError = data.details[0]
          if (firstError.message) {
            errorMessage = `${errorMessage}: ${firstError.message}`
          }
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      setError(`Erro ao ${creditCard ? 'atualizar' : 'criar'} cartão de crédito. Tente novamente.`)
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  // Gerar opções de dias (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Nome do Cartão
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Nubank, Inter, Banco do Brasil..."
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Limite do Cartão
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Dia de Pagamento
        </label>
        <select
          value={paymentDay}
          onChange={(e) => setPaymentDay(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        >
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              Dia {day}
            </option>
          ))}
        </select>
      </div>

      {users.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            Usuário
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            required
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {loading 
          ? (creditCard ? 'Salvando...' : 'Criando...')
          : (creditCard ? 'Salvar Alterações' : 'Criar Cartão')
        }
      </button>
    </form>
  )
}

