'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, Clock, CreditCard, Repeat, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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
    fetchCalendarData()
  }, [currentDate])

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
    <div className="space-y-4 pb-20">
      {/* Controles do Calendário - Mobile First */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all touch-feedback"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-1 flex-1">
            <h2 className="text-lg font-bold text-secondary-900">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            {data && (
              <div className="flex items-center gap-3 text-xs text-secondary-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success-500"></div>
                  {data.totalTransactions} feitas
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                  {data.totalScheduled} agendadas
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-danger-500"></div>
                  {data.totalPending} pendentes
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition-colors touch-feedback"
            >
              Hoje
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all touch-feedback"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid do Calendário - Mobile First */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Cabeçalho dos dias da semana */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-secondary-600 py-2"
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

            const hasConfirmed = dayConfirmed.length > 0
            const hasFuture = hasScheduled || hasPending

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square border-2 rounded-xl p-1.5 cursor-pointer transition-all touch-feedback ${
                  isCurrentDay ? 'bg-primary-50 border-primary-400 ring-2 ring-primary-200' : ''
                } ${isSelected ? 'ring-2 ring-primary-500 border-primary-500 scale-105' : ''} ${
                  hasPending ? 'border-danger-300 bg-danger-50/70' :
                  hasScheduled ? 'border-warning-300 bg-warning-50/70' :
                  hasConfirmed ? 'border-success-200 bg-success-50/30' : 
                  'border-secondary-200 bg-white'
                }`}
              >
                <div className="flex flex-col h-full">
                  {/* Cabeçalho do dia */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
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

                  {/* Valores do dia */}
                  {dayTotal && (
                    <div className="flex-1 flex flex-col justify-end space-y-0.5">
                      {/* Valores confirmados */}
                      {hasConfirmed && (
                        <>
                          {dayTotal.income > 0 && (
                            <div className="text-success-600 font-semibold text-[9px] truncate leading-tight">
                              +{formatCurrency(dayTotal.income).replace('R$', '').trim()}
                            </div>
                          )}
                          {dayTotal.expense > 0 && (
                            <div className="text-danger-600 font-semibold text-[9px] truncate leading-tight">
                              -{formatCurrency(dayTotal.expense).replace('R$', '').trim()}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Valores futuros/pendentes */}
                      {hasFuture && (
                        <div className="pt-0.5 border-t border-secondary-200/50">
                          {dayTotal.scheduledExpense > 0 && (
                            <div className="text-warning-600 font-medium text-[8px] truncate leading-tight flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              ~{formatCurrency(dayTotal.scheduledExpense).replace('R$', '').trim()}
                            </div>
                          )}
                          {dayTotal.pendingExpense > 0 && (
                            <div className="text-danger-700 font-bold text-[8px] truncate leading-tight flex items-center gap-0.5">
                              <AlertCircle className="w-2 h-2" />
                              !{formatCurrency(dayTotal.pendingExpense).replace('R$', '').trim()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indicadores visuais */}
                  {hasTransactions && (
                    <div className="mt-1 flex gap-0.5 flex-wrap justify-center">
                      {dayConfirmed.slice(0, 2).map((t, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            t.type === 'INCOME' ? 'bg-success-500' : 'bg-danger-500'
                          }`}
                          title={`${t.type === 'INCOME' ? 'Receita' : 'Despesa'}: ${t.description}`}
                        />
                      ))}
                      {dayScheduled.slice(0, 1).map((t, idx) => (
                        <div
                          key={`scheduled-${idx}`}
                          className="w-2 h-2 rounded-full bg-warning-500 border border-warning-600"
                          title={`Agendada: ${t.description}`}
                        />
                      ))}
                      {dayPending.slice(0, 1).map((t, idx) => (
                        <div
                          key={`pending-${idx}`}
                          className="w-2 h-2 rounded-full bg-danger-600 border border-danger-700"
                          title={`Pendente: ${t.description}`}
                        />
                      ))}
                      {dayTransactions.length > 4 && (
                        <div className="w-2 h-2 rounded-full bg-secondary-400" title="Mais transações" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

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
                {/* Resumo do Dia */}
                {total && (
                  <div className="space-y-3">
                    {/* Movimentações Confirmadas */}
                    <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-success-100 flex items-center justify-center">
                          <ArrowUpCircle className="w-4 h-4 text-success-600" />
                        </div>
                        <h4 className="text-sm font-bold text-success-700">Movimentações Confirmadas</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-success-600 mb-1">Receitas</div>
                          <div className="text-base font-bold text-success-700">
                            {formatCurrency(total.income)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-danger-600 mb-1">Despesas</div>
                          <div className="text-base font-bold text-danger-700">
                            {formatCurrency(total.expense)}
                          </div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-success-200">
                          <div className="text-xs text-success-600 mb-1">Saldo Confirmado</div>
                          <div
                            className={`text-lg font-bold ${
                              total.balance >= 0 ? 'text-success-700' : 'text-danger-700'
                            }`}
                          >
                            {formatCurrency(total.balance)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Movimentações Futuras/Pendentes */}
                    {(total.scheduledExpense > 0 || total.pendingExpense > 0) && (
                      <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-warning-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-warning-600" />
                          </div>
                          <h4 className="text-sm font-bold text-warning-700">Movimentações Pendentes</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {total.scheduledExpense > 0 && (
                            <div>
                              <div className="text-xs text-warning-600 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Agendadas
                              </div>
                              <div className="text-base font-bold text-warning-700">
                                {formatCurrency(total.scheduledExpense)}
                              </div>
                            </div>
                          )}
                          {total.pendingExpense > 0 && (
                            <div>
                              <div className="text-xs text-danger-600 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Parcelas
                              </div>
                              <div className="text-base font-bold text-danger-700">
                                {formatCurrency(total.pendingExpense)}
                              </div>
                            </div>
                          )}
                          <div className="col-span-2 pt-2 border-t border-warning-200">
                            <div className="text-xs text-warning-600 mb-1">Total Pendente</div>
                            <div className="text-lg font-bold text-warning-700">
                              {formatCurrency(total.scheduledExpense + total.pendingExpense)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transações Confirmadas */}
                {confirmed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-success-700 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-success-100 flex items-center justify-center">
                        <ArrowUpCircle className="w-3 h-3 text-success-600" />
                      </div>
                      Movimentações Confirmadas ({confirmed.length})
                    </h4>
                    <div className="space-y-2">
                      {confirmed.map((transaction) => {
                        const isIncome = transaction.type === 'INCOME'
                        return (
                          <Card
                            key={transaction.id}
                            variant="default"
                            padding="sm"
                            hover
                            className="bg-white border-success-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                                  <p className="font-semibold text-sm text-secondary-900 truncate">
                                    {transaction.description}
                                  </p>
                                  <p className="text-xs text-secondary-500">
                                    {transaction.category.name}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <p
                                  className={`font-bold text-sm ${
                                    isIncome ? 'text-success-600' : 'text-danger-600'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Transações Agendadas */}
                {scheduled.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-warning-700 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-warning-100 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-warning-600" />
                      </div>
                      Movimentações Agendadas ({scheduled.length})
                    </h4>
                    <div className="space-y-2">
                      {scheduled.map((transaction) => {
                        const isIncome = transaction.type === 'INCOME'
                        return (
                          <Card
                            key={transaction.id}
                            variant="default"
                            padding="sm"
                            hover
                            className="bg-warning-50 border-warning-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm text-secondary-900 truncate">
                                      {transaction.description}
                                    </p>
                                    {transaction.isRecurring && (
                                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex-shrink-0">
                                        Recorrente
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-secondary-500">
                                    {transaction.category.name}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <p
                                  className={`font-bold text-sm ${
                                    isIncome ? 'text-success-600' : 'text-warning-700'
                                  }`}
                                >
                                  {isIncome ? '+' : '~'}
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Parcelamentos Pendentes */}
                {pending.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-danger-700 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-danger-100 flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-danger-600" />
                      </div>
                      Parcelas Pendentes ({pending.length})
                    </h4>
                    <div className="space-y-2">
                      {pending.map((transaction) => (
                        <Card
                          key={transaction.id}
                          variant="default"
                          padding="sm"
                          hover
                          className="bg-danger-50 border-danger-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-danger-100 text-danger-600 flex-shrink-0">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-secondary-900 truncate">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-secondary-500">
                                  {transaction.category.name}
                                </p>
                              </div>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <p className="font-bold text-sm text-danger-700">
                                !{formatCurrency(Math.abs(transaction.amount))}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}

      {/* Resumo do Mês - Mobile First */}
      {data && (
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-bold text-secondary-900 mb-4">
            Resumo do Mês
          </h3>
          
          {/* Movimentações Confirmadas */}
          <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-success-100 flex items-center justify-center">
                <ArrowUpCircle className="w-4 h-4 text-success-600" />
              </div>
              <h4 className="text-sm font-bold text-success-700">Movimentações Confirmadas</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-success-600 mb-1">Receitas</div>
                <div className="text-base font-bold text-success-700">
                  {formatCurrency(
                    Object.values(data.dailyTotals).reduce(
                      (sum, day) => sum + day.income,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-danger-600 mb-1">Despesas</div>
                <div className="text-base font-bold text-danger-700">
                  {formatCurrency(
                    Object.values(data.dailyTotals).reduce(
                      (sum, day) => sum + day.expense,
                      0
                    )
                  )}
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-success-200">
                <div className="text-xs text-success-600 mb-1">Saldo do Mês</div>
                <div className={`text-lg font-bold ${
                  Object.values(data.dailyTotals).reduce(
                    (sum, day) => sum + day.income - day.expense,
                    0
                  ) >= 0 ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {formatCurrency(
                    Object.values(data.dailyTotals).reduce(
                      (sum, day) => sum + day.income - day.expense,
                      0
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Movimentações Pendentes */}
          {(data.totalScheduled > 0 || data.totalPending > 0) && (
            <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-warning-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning-600" />
                </div>
                <h4 className="text-sm font-bold text-warning-700">Movimentações Pendentes</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {data.totalScheduled > 0 && (
                  <div>
                    <div className="text-xs text-warning-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Agendadas
                    </div>
                    <div className="text-base font-bold text-warning-700">
                      {formatCurrency(
                        Object.values(data.dailyTotals).reduce(
                          (sum, day) => sum + day.scheduledExpense,
                          0
                        )
                      )}
                    </div>
                  </div>
                )}
                {data.totalPending > 0 && (
                  <div>
                    <div className="text-xs text-danger-600 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Parcelas
                    </div>
                    <div className="text-base font-bold text-danger-700">
                      {formatCurrency(
                        Object.values(data.dailyTotals).reduce(
                          (sum, day) => sum + day.pendingExpense,
                          0
                        )
                      )}
                    </div>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t border-warning-200">
                  <div className="text-xs text-warning-600 mb-1">Total Pendente</div>
                  <div className="text-lg font-bold text-warning-700">
                    {formatCurrency(
                      Object.values(data.dailyTotals).reduce(
                        (sum, day) => sum + day.scheduledExpense + day.pendingExpense,
                        0
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contadores */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-secondary-200 text-center text-xs">
            <div className="p-2 bg-success-50 rounded-lg">
              <div className="text-success-600 mb-0.5">Confirmadas</div>
              <div className="font-bold text-success-700">{data.totalTransactions}</div>
            </div>
            <div className="p-2 bg-warning-50 rounded-lg">
              <div className="text-warning-600 mb-0.5">Agendadas</div>
              <div className="font-bold text-warning-700">{data.totalScheduled}</div>
            </div>
            <div className="p-2 bg-danger-50 rounded-lg">
              <div className="text-danger-600 mb-0.5">Pendentes</div>
              <div className="font-bold text-danger-700">{data.totalPending}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Legenda - Mobile First */}
      <Card variant="outlined" padding="md">
        <h4 className="text-sm font-bold text-secondary-900 mb-3">Legenda</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-success-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="text-secondary-700 font-medium">Movimentação Confirmada</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-warning-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-warning-500 border border-warning-600"></div>
            <span className="text-secondary-700 font-medium">Movimentação Agendada</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-danger-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-danger-600 border border-danger-700"></div>
            <span className="text-secondary-700 font-medium">Parcela Pendente</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

