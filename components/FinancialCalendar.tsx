'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, Clock, CreditCard, Repeat, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'

interface CalendarData {
  year: number
  month: number
  transactionsByDay: Record<string, any[]>
  confirmedByDay: Record<string, any[]>
  scheduledByDay: Record<string, any[]>
  pendingByDay: Record<string, any[]>
  dailyTotals: Record<string, { 
    income: number
    expense: number
    balance: number
    scheduledIncome: number
    scheduledExpense: number
    pendingExpense: number
  }>
  totalTransactions: number
  totalScheduled: number
  totalPending: number
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

  const getDayConfirmed = (date: Date) => {
    if (!data) return []
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.confirmedByDay[dateKey] || []
  }

  const getDayScheduled = (date: Date) => {
    if (!data) return []
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.scheduledByDay[dateKey] || []
  }

  const getDayPending = (date: Date) => {
    if (!data) return []
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.pendingByDay[dateKey] || []
  }

  const getDayTotal = (date: Date) => {
    if (!data) return null
    const dateKey = format(date, 'yyyy-MM-dd')
    return data.dailyTotals[dateKey] || null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-3 h-3 text-warning-600" />
      case 'pending':
        return <CreditCard className="w-3 h-3 text-danger-600" />
      case 'recurring':
        return <Repeat className="w-3 h-3 text-primary-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-warning-100 border-warning-300'
      case 'pending':
        return 'bg-danger-100 border-danger-300'
      case 'recurring':
        return 'bg-primary-100 border-primary-300'
      default:
        return 'bg-secondary-50'
    }
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" height={400} />
        <Skeleton variant="rectangular" height={200} />
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
            const dayConfirmed = getDayConfirmed(day)
            const dayScheduled = getDayScheduled(day)
            const dayPending = getDayPending(day)
            const dayTotal = getDayTotal(day)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasTransactions = dayTransactions.length > 0
            const hasScheduled = dayScheduled.length > 0
            const hasPending = dayPending.length > 0

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square border-2 rounded-lg p-1 cursor-pointer transition-all hover:shadow-md ${
                  isCurrentDay ? 'bg-primary-50 border-primary-400' : ''
                } ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''} ${
                  hasPending ? 'border-danger-300 bg-danger-50/50' :
                  hasScheduled ? 'border-warning-300 bg-warning-50/50' :
                  hasTransactions ? 'border-secondary-200 bg-secondary-50' : 'border-secondary-200'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isCurrentDay ? 'text-primary-700' : 'text-secondary-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {(hasScheduled || hasPending) && (
                      <div className="flex gap-0.5">
                        {hasPending && <AlertCircle className="w-2.5 h-2.5 text-danger-600" />}
                        {hasScheduled && <Clock className="w-2.5 h-2.5 text-warning-600" />}
                      </div>
                    )}
                  </div>
                  {dayTotal && (
                    <div className="flex-1 flex flex-col justify-end text-[9px] space-y-0.5">
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
                      {dayTotal.scheduledExpense > 0 && (
                        <div className="text-warning-600 font-medium truncate text-[8px]">
                          ~{formatCurrency(dayTotal.scheduledExpense).replace('R$', '').trim()}
                        </div>
                      )}
                      {dayTotal.pendingExpense > 0 && (
                        <div className="text-danger-700 font-bold truncate text-[8px]">
                          !{formatCurrency(dayTotal.pendingExpense).replace('R$', '').trim()}
                        </div>
                      )}
                    </div>
                  )}
                  {hasTransactions && (
                    <div className="mt-1 flex gap-0.5 flex-wrap">
                      {dayConfirmed.slice(0, 2).map((t, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.type === 'INCOME' ? 'bg-success-500' : 'bg-danger-500'
                          }`}
                          title={t.description}
                        />
                      ))}
                      {dayScheduled.slice(0, 1).map((t, idx) => (
                        <div
                          key={`scheduled-${idx}`}
                          className="w-1.5 h-1.5 rounded-full bg-warning-500"
                          title={t.description}
                        />
                      ))}
                      {dayPending.slice(0, 1).map((t, idx) => (
                        <div
                          key={`pending-${idx}`}
                          className="w-1.5 h-1.5 rounded-full bg-danger-600"
                          title={t.description}
                        />
                      ))}
                      {dayTransactions.length > 4 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-400" />
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
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-secondary-500 hover:text-secondary-700 p-1 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {(() => {
            const confirmed = getDayConfirmed(selectedDate)
            const scheduled = getDayScheduled(selectedDate)
            const pending = getDayPending(selectedDate)
            const total = getDayTotal(selectedDate)
            const allTransactions = [...confirmed, ...scheduled, ...pending]

            if (allTransactions.length === 0) {
              return (
                <EmptyState
                  icon={<CalendarIcon className="w-full h-full" />}
                  title="Nenhuma transação neste dia"
                  description="Não há transações confirmadas, agendadas ou pendentes para esta data"
                />
              )
            }

            return (
              <div className="space-y-4">
                {total && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-secondary-50 rounded-xl">
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
                    {total.scheduledExpense > 0 && (
                      <div className="text-center">
                        <div className="text-xs text-secondary-600 mb-1 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          Agendadas
                        </div>
                        <div className="text-sm font-bold text-warning-600">
                          {formatCurrency(total.scheduledExpense)}
                        </div>
                      </div>
                    )}
                    {total.pendingExpense > 0 && (
                      <div className="text-center">
                        <div className="text-xs text-secondary-600 mb-1 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pendentes
                        </div>
                        <div className="text-sm font-bold text-danger-700">
                          {formatCurrency(total.pendingExpense)}
                        </div>
                      </div>
                    )}
                    <div className="text-center col-span-2 sm:col-span-4 pt-2 border-t border-secondary-200">
                      <div className="text-xs text-secondary-600 mb-1">Saldo do Dia</div>
                      <div
                        className={`text-base font-bold ${
                          total.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(total.balance)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transações Confirmadas */}
                {confirmed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" />
                      Transações Confirmadas ({confirmed.length})
                    </h4>
                    <div className="space-y-2">
                      {confirmed.map((transaction) => {
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
                )}

                {/* Transações Agendadas */}
                {scheduled.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning-600" />
                      Transações Agendadas ({scheduled.length})
                    </h4>
                    <div className="space-y-2">
                      {scheduled.map((transaction) => {
                        const isIncome = transaction.type === 'INCOME'
                        return (
                          <div
                            key={transaction.id}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${getStatusColor(transaction.status)}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  isIncome
                                    ? 'bg-success-100 text-success-600'
                                    : 'bg-warning-100 text-warning-600'
                                }`}
                              >
                                {transaction.isRecurring ? (
                                  <Repeat className="w-5 h-5" />
                                ) : isIncome ? (
                                  <ArrowUpCircle className="w-5 h-5" />
                                ) : (
                                  <ArrowDownCircle className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-secondary-900 truncate">
                                    {transaction.description}
                                  </p>
                                  {transaction.isRecurring && (
                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                      Recorrente
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-secondary-500">
                                  {transaction.category.name}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4">
                              <p
                                className={`font-bold ${
                                  isIncome ? 'text-success-600' : 'text-warning-700'
                                }`}
                              >
                                {isIncome ? '+' : '~'}
                                {formatCurrency(Math.abs(transaction.amount))}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Parcelamentos Pendentes */}
                {pending.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-danger-600" />
                      Parcelamentos Pendentes ({pending.length})
                    </h4>
                    <div className="space-y-2">
                      {pending.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${getStatusColor(transaction.status)}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-danger-100 text-danger-600">
                              <CreditCard className="w-5 h-5" />
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
                            <p className="font-bold text-danger-700">
                              !{formatCurrency(Math.abs(transaction.amount))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}

      {/* Resumo do Mês */}
      {data && (
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Resumo do Mês
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
              <div className="text-xs text-secondary-600 mb-1">Receitas Confirmadas</div>
              <div className="text-lg font-bold text-success-600">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.income,
                    0
                  )
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-danger-50 rounded-xl border border-danger-200">
              <div className="text-xs text-secondary-600 mb-1">Despesas Confirmadas</div>
              <div className="text-lg font-bold text-danger-600">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.expense,
                    0
                  )
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-warning-50 rounded-xl border border-warning-200">
              <div className="text-xs text-secondary-600 mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Agendadas
              </div>
              <div className="text-lg font-bold text-warning-600">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.scheduledExpense,
                    0
                  )
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-danger-100 rounded-xl border-2 border-danger-300">
              <div className="text-xs text-secondary-700 mb-1 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pendentes
              </div>
              <div className="text-lg font-bold text-danger-700">
                {formatCurrency(
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.pendingExpense,
                    0
                  )
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-secondary-200 text-center text-sm">
            <div>
              <span className="text-secondary-600">Confirmadas: </span>
              <span className="font-semibold text-secondary-900">{data.totalTransactions}</span>
            </div>
            <div>
              <span className="text-secondary-600">Agendadas: </span>
              <span className="font-semibold text-warning-600">{data.totalScheduled}</span>
            </div>
            <div>
              <span className="text-secondary-600">Pendentes: </span>
              <span className="font-semibold text-danger-600">{data.totalPending}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Legenda */}
      <Card variant="outlined" padding="md">
        <h4 className="text-sm font-semibold text-secondary-700 mb-3">Legenda</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="text-secondary-600">Receita Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-500"></div>
            <span className="text-secondary-600">Despesa Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-500"></div>
            <span className="text-secondary-600">Transação Agendada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-600"></div>
            <span className="text-secondary-600">Parcela Pendente</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

