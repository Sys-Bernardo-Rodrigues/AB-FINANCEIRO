'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowDownCircle, ArrowUpCircle, User, Upload, FileImage, Loader2, Check, X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { showToast } from '@/components/ui/Toast'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface UserData {
  id: string
  name: string
  email: string
}

export default function TransactionForm() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptUploaded, setReceiptUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (currentUser && !userId) {
      setUserId(currentUser.id)
    }
  }, [currentUser, userId])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        const filtered = data.filter((cat: Category) => cat.type === type)
        if (filtered.length > 0) {
          setCategoryId(filtered[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

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

  const filteredCategories = categories.filter(cat => cat.type === type)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo muito grande. Tamanho máximo: 10MB', 'error')
      return
    }

    // Validar tipo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      showToast('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou PDF', 'error')
      return
    }

    setReceiptFile(file)
    setReceiptUploaded(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Primeiro criar a transação
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          type,
          categoryId,
          date: isScheduled && scheduledDate ? scheduledDate : date,
          userId: userId || undefined,
          isScheduled: isScheduled && scheduledDate ? true : false,
          scheduledDate: isScheduled && scheduledDate ? scheduledDate : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.error || 'Erro ao criar transação'
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return
      }

      const transaction = await response.json()

      // Se há um comprovante, fazer upload
      if (receiptFile && transaction.id) {
        setUploadingReceipt(true)
        try {
          const formData = new FormData()
          formData.append('file', receiptFile)
          formData.append('transactionId', transaction.id)

          const receiptResponse = await fetch('/api/receipts', {
            method: 'POST',
            body: formData,
          })

          if (receiptResponse.ok) {
            setReceiptUploaded(true)
            showToast('Transação e comprovante criados com sucesso!', 'success')
          } else {
            showToast('Transação criada, mas houve erro ao enviar comprovante', 'warning')
          }
        } catch (error) {
          console.error('Erro ao fazer upload do comprovante:', error)
          showToast('Transação criada, mas houve erro ao enviar comprovante', 'warning')
        } finally {
          setUploadingReceipt(false)
        }
      } else {
        showToast('Transação criada com sucesso!', 'success')
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      const errorMessage = 'Erro ao criar transação. Tente novamente.'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptUploaded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
          {/* Seletor de Tipo */}
          <div className="glass rounded-3xl p-2 flex gap-2 border border-secondary-200/50 shadow-card backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setType('EXPENSE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation hover-lift ${
                type === 'EXPENSE'
                  ? 'bg-danger-50 text-danger-700 border-2 border-danger-300 shadow-md'
                  : 'text-secondary-600 hover:text-danger-600 hover:bg-danger-50/50'
              }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setType('INCOME')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation hover-lift ${
                type === 'INCOME'
                  ? 'bg-success-50 text-success-700 border-2 border-success-300 shadow-md'
                  : 'text-secondary-600 hover:text-success-600 hover:bg-success-50/50'
              }`}
        >
          <ArrowUpCircle className="w-5 h-5" />
          Receita
        </button>
      </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <Input
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              required
            />

            <Input
              label="Valor"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />

        <div>
          <Input
            label="Data"
            type="date"
            value={isScheduled ? scheduledDate : date}
            onChange={(e) => {
              if (isScheduled) {
                setScheduledDate(e.target.value)
              } else {
                setDate(e.target.value)
              }
            }}
            required
          />
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => {
                setIsScheduled(e.target.checked)
                if (e.target.checked) {
                  setScheduledDate(date)
                }
              }}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700">
              Agendar para data futura
            </span>
          </label>
        </div>

        <Select
          label="Usuário"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          leftIcon={<User className="w-5 h-5" />}
          required
          options={
            users.length === 0
              ? [{ value: '', label: 'Carregando usuários...' }]
              : users.map((user) => ({
                  value: user.id,
                  label: `${user.name}${user.id === currentUser?.id ? ' (Você)' : ''}`,
                }))
          }
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          options={
            filteredCategories.length === 0
              ? [{ value: '', label: 'Carregando categorias...' }]
              : filteredCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))
          }
        />

        {/* Upload de Comprovante */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Comprovante (Opcional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="receipt-upload"
            disabled={uploadingReceipt || loading}
          />
          
          {!receiptFile ? (
            <label
              htmlFor="receipt-upload"
              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all touch-manipulation ${
                uploadingReceipt || loading
                  ? 'border-secondary-200 bg-secondary-50 cursor-not-allowed opacity-50'
                  : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
              }`}
            >
              <Upload className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700">
                Adicionar Comprovante
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-secondary-50 border-2 border-secondary-200 rounded-xl">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {receiptFile.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {(receiptFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeReceipt}
                className="p-2 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                disabled={uploadingReceipt || loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <p className="text-xs text-secondary-500 mt-2">
            JPG, PNG, WEBP ou PDF (máx. 10MB)
          </p>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          isLoading={loading}
          variant={type === 'INCOME' ? 'success' : 'danger'}
          fullWidth
          size="lg"
          leftIcon={type === 'INCOME' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
        >
          Adicionar Transação
        </Button>
      </form>
    </div>
  )
}
