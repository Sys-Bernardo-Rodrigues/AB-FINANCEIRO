'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar as CalendarIcon,
} from 'lucide-react'

interface CalendarTransaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    name: string
  }
}

interface CalendarResponse {
  transactionsByDay: {
    [date: string]: CalendarTransaction[]
  }
  confirmedByDay?: {
    [date: string]: CalendarTransaction[]
  }
  scheduledByDay?: {
    [date: string]: CalendarTransaction[]
  }
  pendingByDay?: {
    [date: string]: CalendarTransaction[]
  }
}

export default function CalendarPage() {
  const router = useRouter()
  const [calendarData, setCalendarData] = useState<CalendarResponse>({
    transactionsByDay: {},
  })
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadCalendar()
  }, [currentMonth, currentYear])

  const loadCalendar = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<CalendarResponse>(
        `/transactions/calendar?month=${currentMonth}&year=${currentYear}`
      )
      setCalendarData(data)
    } catch (error) {
      console.error('Erro ao carregar calendário:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  // Calcular dias do mês
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  const days = []

  // Adicionar dias vazios do início
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }

  // Adicionar dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // Buscar transações do dia
    const allTransactions = calendarData.transactionsByDay[dateStr] || []
    
    days.push({
      day,
      date: dateStr,
      transactions: allTransactions,
    })
  }

  const calculateDayTotal = (transactions: CalendarTransaction[]) => {
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses, balance: income - expenses }
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 truncate">
            {formatMonthYear(currentMonth, currentYear)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 hidden sm:block">
            Visualize suas transações no calendário
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => changeMonth('prev')}
            size="sm"
            className="min-w-[40px] p-2"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const now = new Date()
              setCurrentMonth(now.getMonth() + 1)
              setCurrentYear(now.getFullYear())
            }}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Hoje</span>
            <CalendarIcon className="w-4 h-4 sm:hidden" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => changeMonth('next')}
            size="sm"
            className="min-w-[40px] p-2"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Calendário */}
      <Card className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Cabeçalho dos dias da semana */}
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="text-center font-semibold text-slate-600 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysShort[index]}</span>
            </div>
          ))}

          {/* Dias do mês */}
          {days.map((dayData, index) => {
            if (!dayData) {
              return <div key={`empty-${index}`} className="h-16 sm:h-20 lg:h-24" />
            }

            const { day, date, transactions } = dayData
            const totals = calculateDayTotal(transactions)
            const isToday =
              date ===
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

            return (
              <div
                key={date}
                className={`border border-slate-200 rounded-lg sm:rounded-xl p-1.5 sm:p-2 min-h-[64px] sm:h-20 lg:h-24 ${
                  isToday ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-200' : 'bg-slate-50'
                } hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation flex flex-col`}
                onClick={() => {
                  // Filtrar transações por data e ir para página de transações
                  const url = `/transactions?startDate=${date}&endDate=${date}`
                  router.push(url)
                }}
              >
                <div className="flex items-center justify-between mb-0.5 sm:mb-1 flex-shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      isToday ? 'text-primary-700' : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {totals.balance !== 0 && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold leading-tight ${
                        totals.balance >= 0
                          ? 'text-success-600'
                          : 'text-danger-600'
                      }`}
                    >
                      {totals.balance >= 0 ? '+' : ''}
                      <span className="hidden sm:inline">
                        {formatCurrency(totals.balance).replace('R$', 'R$')}
                      </span>
                      <span className="sm:hidden">
                        {formatCurrency(totals.balance).replace('R$', '').split(',')[0]}
                      </span>
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden">
                  {transactions.slice(0, 1).map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate ${
                        transaction.type === 'INCOME'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}
                      title={transaction.description}
                    >
                      <span className="hidden sm:inline">
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount).replace('R$', '')}
                      </span>
                      <span className="sm:hidden">
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount).replace('R$', '').split(',')[0]}
                      </span>
                    </div>
                  ))}
                  {transactions.length > 1 && (
                    <div className="text-[9px] sm:text-xs text-slate-500 leading-tight">
                      +{transactions.length - 1}
                      <span className="hidden sm:inline"> mais</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legenda */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-success-100 border border-success-300 flex-shrink-0"></div>
            <span className="text-slate-600 whitespace-nowrap">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-danger-100 border border-danger-300 flex-shrink-0"></div>
            <span className="text-slate-600 whitespace-nowrap">Despesas</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary-100 border border-primary-300 flex-shrink-0"></div>
            <span className="text-slate-600 whitespace-nowrap">Dia Atual</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

