'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface CalendarData {
  year: number
  month: number
  transactionsByDay: Record<string, any[]>
  dailyTotals: Record<string, { income: number; expense: number; balance: number }>
  totalTransactions: number
}

export default function FinancialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await fetch(`/api/transactions/calendar?year=${year}&month=${month}`)
      if (response.ok) {
        const calendarData = await response.json()
        setData(calendarData)
      }
    } catch (error) {
      console.error('Erro ao buscar calendário:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adicionar dias vazios no início para alinhar com a semana
  const firstDayOfWeek = getDay(monthStart)
  const emptyDays = Array.from({ length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 }, (_, i) => i)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDayTransactions = (date: Date) => {
    if (!data) return []
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.transactionsByDay[dateKey] || []
  }

  const getDayTotal = (date: Date) => {
    if (!data) return null
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.dailyTotals[dateKey] || null
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles do Calendário */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-secondary-900">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm touch-manipulation"
            >
              Hoje
            </button>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-secondary-600 py-2"
            >
              {day}
            </div>
          ))}

          {/* Dias vazios no início */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Dias do mês */}
          {daysInMonth.map((day) => {
            const dayTransactions = getDayTransactions(day)
            const dayTotal = getDayTotal(day)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasTransactions = dayTransactions.length > 0

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square border border-secondary-200 rounded-lg p-1 cursor-pointer transition-all hover:border-primary-300 hover:shadow-md ${
                  isCurrentDay ? 'bg-primary-50 border-primary-300' : ''
                } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${
                  hasTransactions ? 'bg-secondary-50' : ''
                }`}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-xs font-semibold mb-1 ${
                      isCurrentDay ? 'text-primary-600' : 'text-secondary-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTotal && (
                    <div className="flex-1 flex flex-col justify-end text-[10px] space-y-0.5">
                      {dayTotal.income > 0 && (
                        <div className="text-success-600 font-medium truncate">
                          +{formatCurrency(dayTotal.income).replace('R$', '').trim()}
                        </div>
                      )}
                      {dayTotal.expense > 0 && (
                        <div className="text-danger-600 font-medium truncate">
                          -{formatCurrency(dayTotal.expense).replace('R$', '').trim()}
                        </div>
                      )}
                      {dayTotal.balance !== 0 && (
                        <div
                          className={`font-bold ${
                            dayTotal.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                          }`}
                        >
                          {dayTotal.balance >= 0 ? '+' : ''}
                          {formatCurrency(dayTotal.balance).replace('R$', '').trim()}
                        </div>
                      )}
                    </div>
                  )}
                  {hasTransactions && (
                    <div className="mt-1 flex gap-0.5">
                      {dayTransactions.slice(0, 3).map((t, idx) => (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            t.type === 'INCOME' ? 'bg-success-500' : 'bg-danger-500'
                          }`}
                        />
                      ))}
                      {dayTransactions.length > 3 && (
                        <div className="w-1 h-1 rounded-full bg-secondary-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalhes do Dia Selecionado */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-secondary-500 hover:text-secondary-700"
            >
              ✕
            </button>
          </div>

          {(() => {
            const transactions = getDayTransactions(selectedDate)
            const total = getDayTotal(selectedDate)

            if (transactions.length === 0) {
              return (
                <div className="text-center py-8 text-secondary-500">
                  Nenhuma transação neste dia
                </div>
              )
            }

            return (
              <div className="space-y-4">
                {total && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-secondary-50 rounded-xl">
                    <div className="text-center">
                      <div className="text-xs text-secondary-600 mb-1">Receitas</div>
                      <div className="text-sm font-bold text-success-600">
                        {formatCurrency(total.income)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-secondary-600 mb-1">Despesas</div>
                      <div className="text-sm font-bold text-danger-600">
                        {formatCurrency(total.expense)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-secondary-600 mb-1">Saldo</div>
                      <div
                        className={`text-sm font-bold ${
                          total.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(total.balance)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {transactions.map((transaction) => {
                    const isIncome = transaction.type === 'INCOME'
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isIncome
                                ? 'bg-success-100 text-success-600'
                                : 'bg-danger-100 text-danger-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpCircle className="w-5 h-5" />
                            ) : (
                              <ArrowDownCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-secondary-900 truncate">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-secondary-500">
                              {transaction.category.name}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p
                            className={`font-bold ${
                              isIncome ? 'text-success-600' : 'text-danger-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Resumo do Mês */}
      {data && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Resumo do Mês
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-success-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Total de Receitas</div>
              <div className="text-xl font-bold text-success-600">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.income,
                    0
                  )
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-danger-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Total de Despesas</div>
              <div className="text-xl font-bold text-danger-600">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.expense,
                    0
                  )
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-secondary-600">
            {data.totalTransactions} transações no mês
          </div>
        </div>
      )}
    </div>
  )
}

