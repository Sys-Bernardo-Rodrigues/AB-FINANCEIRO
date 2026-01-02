'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowDownCircle, ArrowUpCircle, User, Upload, FileImage, X, Calendar, Tag, DollarSign, CreditCard } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
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

interface Installment {
  id: string
  description: string
  totalAmount: number
  installments: number
  currentInstallment: number
  categoryId: string
  category: Category
  status: string
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
  const [installments, setInstallments] = useState<Installment[]>([])
  const [installmentId, setInstallmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptUploaded, setReceiptUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
    fetchUsers()
    fetchInstallments()
  }, [])

  useEffect(() => {
    if (currentUser && !userId) {
      setUserId(currentUser.id)
    }
  }, [currentUser, userId])

  // Atualizar categoria quando o tipo mudar
  useEffect(() => {
    const filtered = categories.filter(cat => cat.type === type)
    if (filtered.length > 0) {
      const currentCategory = categories.find(cat => cat.id === categoryId)
      if (!currentCategory || currentCategory.type !== type) {
        setCategoryId(filtered[0].id)
      }
    } else {
      setCategoryId('')
    }
  }, [type, categories])

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

  const fetchInstallments = async () => {
    try {
      const response = await fetch('/api/installments?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setInstallments(data)
      }
    } catch (error) {
      console.error('Erro ao buscar parcelamentos:', error)
    }
  }

  // Quando um parcelamento for selecionado, preencher automaticamente os campos
  useEffect(() => {
    if (installmentId) {
      const selectedInstallment = installments.find(inst => inst.id === installmentId)
      if (selectedInstallment) {
        // Preencher categoria
        setCategoryId(selectedInstallment.categoryId)
        // Calcular valor da parcela
        const installmentAmount = selectedInstallment.totalAmount / selectedInstallment.installments
        setAmount(installmentAmount.toFixed(2))
        // Preencher descrição com número da parcela
        const nextInstallment = selectedInstallment.currentInstallment + 1
        setDescription(`${selectedInstallment.description} - Parcela ${nextInstallment}/${selectedInstallment.installments}`)
        // Forçar tipo como despesa (parcelamentos são sempre despesas)
        setType('EXPENSE')
      }
    }
  }, [installmentId, installments])

  const filteredCategories = categories.filter(cat => cat.type === type)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo muito grande. Tamanho máximo: 10MB', 'error')
      return
    }

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

    if (!description.trim()) {
      setError('Descrição é obrigatória')
      showToast('Descrição é obrigatória', 'error')
      setLoading(false)
      return
    }

    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Valor deve ser um número positivo')
      showToast('Valor deve ser um número positivo', 'error')
      setLoading(false)
      return
    }

    if (!categoryId) {
      setError('Categoria é obrigatória')
      showToast('Categoria é obrigatória', 'error')
      setLoading(false)
      return
    }

    if (!userId) {
      setError('Usuário é obrigatório')
      showToast('Usuário é obrigatório', 'error')
      setLoading(false)
      return
    }

    try {
      const transactionData: any = {
        description: description.trim(),
        amount: amountValue,
        type,
        categoryId,
        date: isScheduled && scheduledDate ? scheduledDate : date,
      }

      if (userId) {
        transactionData.userId = userId
      }

      if (isScheduled && scheduledDate) {
        transactionData.isScheduled = true
        transactionData.scheduledDate = scheduledDate
      }

      // Adicionar installmentId se fornecido
      if (installmentId) {
        transactionData.installmentId = installmentId
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const data = await response.json()
        let errorMessage = data.error || 'Erro ao criar transação'
        
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const firstError = data.details[0]
          const fieldName = firstError.field || 'campo'
          errorMessage = `${errorMessage}: ${fieldName} - ${firstError.message}`
        }
        
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return
      }

      const transaction = await response.json()

      // Se a transação foi vinculada a um parcelamento, atualizar o currentInstallment
      if (installmentId && transaction.id) {
        try {
          const selectedInstallment = installments.find(inst => inst.id === installmentId)
          if (selectedInstallment) {
            // Verificar se ainda há parcelas pendentes
            if (selectedInstallment.currentInstallment < selectedInstallment.installments) {
              const nextInstallment = selectedInstallment.currentInstallment + 1
              const isCompleted = nextInstallment >= selectedInstallment.installments
              
              // Atualizar parcelamento
              const updateResponse = await fetch(`/api/installments/${installmentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  currentInstallment: nextInstallment,
                  status: isCompleted ? 'COMPLETED' : 'ACTIVE',
                }),
              })
              
              if (updateResponse.ok) {
                if (isCompleted) {
                  showToast('Transação vinculada! Parcelamento concluído!', 'success')
                } else {
                  showToast('Transação vinculada ao parcelamento com sucesso!', 'success')
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao atualizar parcelamento:', error)
          // Não falhar a criação da transação se a atualização do parcelamento falhar
        }
      }

      // Mensagem de sucesso será exibida após atualizar parcelamento (se houver)
      let successMessageShown = false

      // Se a transação foi vinculada a um parcelamento, atualizar o currentInstallment
      if (installmentId && transaction.id) {
        try {
          const selectedInstallment = installments.find(inst => inst.id === installmentId)
          if (selectedInstallment) {
            // Verificar se ainda há parcelas pendentes
            if (selectedInstallment.currentInstallment < selectedInstallment.installments) {
              const nextInstallment = selectedInstallment.currentInstallment + 1
              const isCompleted = nextInstallment >= selectedInstallment.installments
              
              // Atualizar parcelamento
              const updateResponse = await fetch(`/api/installments/${installmentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  currentInstallment: nextInstallment,
                  status: isCompleted ? 'COMPLETED' : 'ACTIVE',
                }),
              })
              
              if (updateResponse.ok) {
                successMessageShown = true
                if (isCompleted) {
                  showToast('Transação vinculada! Parcelamento concluído!', 'success')
                } else {
                  showToast('Transação vinculada ao parcelamento com sucesso!', 'success')
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao atualizar parcelamento:', error)
          // Não falhar a criação da transação se a atualização do parcelamento falhar
        }
      }

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
            if (!successMessageShown) {
              showToast('Transação e comprovante criados com sucesso!', 'success')
            } else {
              showToast('Comprovante adicionado com sucesso!', 'success')
            }
          } else {
            if (!successMessageShown) {
              showToast('Transação criada, mas houve erro ao enviar comprovante', 'warning')
            } else {
              showToast('Erro ao enviar comprovante', 'warning')
            }
          }
        } catch (error) {
          console.error('Erro ao fazer upload do comprovante:', error)
          if (!successMessageShown) {
            showToast('Transação criada, mas houve erro ao enviar comprovante', 'warning')
          } else {
            showToast('Erro ao enviar comprovante', 'warning')
          }
        } finally {
          setUploadingReceipt(false)
        }
      } else if (!successMessageShown) {
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
    <div className="space-y-4 pb-4">
      {/* Seletor de Tipo - Design Melhorado */}
      <Card variant="default" padding="sm" className="bg-gradient-to-r from-white to-secondary-50/50">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-200 touch-feedback ${
              type === 'EXPENSE'
                ? 'bg-danger-50 text-danger-700 border-2 border-danger-300 shadow-sm'
                : 'text-secondary-600 hover:text-danger-600 hover:bg-danger-50/50 border-2 border-transparent'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span>Despesa</span>
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-200 touch-feedback ${
              type === 'INCOME'
                ? 'bg-success-50 text-success-700 border-2 border-success-300 shadow-sm'
                : 'text-secondary-600 hover:text-success-600 hover:bg-success-50/50 border-2 border-transparent'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>Receita</span>
          </button>
        </div>
      </Card>

      {/* Formulário - Design Melhorado */}
      <Card variant="default" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                type === 'INCOME' ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                {type === 'INCOME' ? (
                  <ArrowUpCircle className={`w-5 h-5 ${type === 'INCOME' ? 'text-success-600' : 'text-danger-600'}`} />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-danger-600" />
                )}
              </div>
              <h2 className="text-lg font-bold text-secondary-900">
                Informações Básicas
              </h2>
            </div>

            <Input
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              required
              disabled={!!installmentId}
            />

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Valor"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                leftIcon={<DollarSign className="w-5 h-5" />}
                required
                disabled={!!installmentId}
              />
            </div>
          </div>

          {/* Parcelamento - Opcional */}
          {installments.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-secondary-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-900">
                    Parcelamento
                  </h2>
                  <p className="text-xs text-secondary-500">Vincular a um parcelamento existente</p>
                </div>
              </div>

              <Select
                label="Parcelamento (Opcional)"
                value={installmentId}
                onChange={(e) => {
                  setInstallmentId(e.target.value)
                  if (!e.target.value) {
                    // Limpar campos se desmarcar parcelamento
                    setDescription('')
                    setAmount('')
                  }
                }}
                leftIcon={<CreditCard className="w-5 h-5" />}
                options={[
                  { value: '', label: 'Nenhum parcelamento' },
                  ...installments
                    .filter((installment) => {
                      // Mostrar apenas parcelamentos que ainda têm parcelas pendentes
                      return installment.currentInstallment < installment.installments
                    })
                    .map((installment) => {
                      const paidCount = installment.currentInstallment
                      const remaining = installment.installments - paidCount
                      const installmentAmount = installment.totalAmount / installment.installments
                      return {
                        value: installment.id,
                        label: `${installment.description} (${paidCount}/${installment.installments} pagas, ${remaining} restantes) - R$ ${installmentAmount.toFixed(2)}/parcela`,
                      }
                    }),
                ]}
              />

              {installmentId && (
                <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl">
                  <p className="text-xs text-warning-700 font-medium">
                    ℹ️ Os campos Categoria, Valor e Descrição serão preenchidos automaticamente
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Categoria e Usuário */}
          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-secondary-900">
                Classificação
              </h2>
            </div>

            <Select
              label="Categoria"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              leftIcon={<Tag className="w-5 h-5" />}
              required
              disabled={!!installmentId}
              options={
                filteredCategories.length === 0
                  ? [{ value: '', label: 'Carregando categorias...' }]
                  : filteredCategories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))
              }
            />

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
          </div>

          {/* Data e Agendamento */}
          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning-600" />
              </div>
              <h2 className="text-lg font-bold text-secondary-900">
                Data
              </h2>
            </div>

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
              leftIcon={<Calendar className="w-5 h-5" />}
              required
            />
            
            <label className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => {
                  setIsScheduled(e.target.checked)
                  if (e.target.checked) {
                    setScheduledDate(date)
                  }
                }}
                className="w-5 h-5 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-secondary-700">
                Agendar para data futura
              </span>
            </label>
          </div>

          {/* Comprovante */}
          <div className="space-y-3 pt-4 border-t border-secondary-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-secondary-900">
                  Comprovante
                </h2>
                <p className="text-xs text-secondary-500">Opcional</p>
              </div>
            </div>

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
                className={`flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all touch-feedback ${
                  uploadingReceipt || loading
                    ? 'border-secondary-200 bg-secondary-50 cursor-not-allowed opacity-50'
                    : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
              >
                <Upload className="w-5 h-5 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">
                  Adicionar Comprovante
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-success-50 border-2 border-success-200 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-5 h-5 text-success-600" />
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
                  className="p-2 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-feedback"
                  disabled={uploadingReceipt || loading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <p className="text-xs text-secondary-500 text-center">
              JPG, PNG, WEBP ou PDF (máx. 10MB)
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Botão de Submit */}
          <div className="pt-4 border-t border-secondary-200">
            <Button
              type="submit"
              isLoading={loading}
              variant={type === 'INCOME' ? 'success' : 'danger'}
              fullWidth
              size="lg"
              leftIcon={type === 'INCOME' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
            >
              {loading ? 'Criando...' : 'Adicionar Transação'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
