import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calcular início e fim do mês
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Buscar transações confirmadas do mês
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isScheduled: false, // Apenas confirmadas
      },
      include: {
        category: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Buscar transações agendadas do mês
    const scheduledTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        isScheduled: true,
      },
      include: {
        category: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    // Buscar parcelamentos ativos
    const installments = await prisma.installment.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        transactions: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    })

    // Calcular todas as parcelas pendentes
    const pendingInstallments: any[] = []
    installments.forEach((installment) => {
      const paidTransactions = installment.transactions.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const paidCount = paidTransactions.length
      const remaining = installment.installments - paidCount
      
      if (remaining > 0) {
        const installmentAmount = installment.totalAmount / installment.installments
        const startDateInstallment = new Date(installment.startDate)
        startDateInstallment.setHours(0, 0, 0, 0)
        
        // Calcular todas as parcelas pendentes
        // Cada parcela é calculada como: data de início + (número da parcela - 1) meses
        for (let parcelNumber = paidCount + 1; parcelNumber <= installment.installments; parcelNumber++) {
          // Calcular data baseada na data de início do parcelamento
          const parcelDate = new Date(startDateInstallment)
          parcelDate.setMonth(parcelDate.getMonth() + (parcelNumber - 1))
          parcelDate.setHours(0, 0, 0, 0)
          
          // Se já há parcelas pagas, verificar se a última paga não está muito atrasada
          // e ajustar a data se necessário
          if (paidTransactions.length > 0) {
            const lastPaidTransaction = paidTransactions[paidTransactions.length - 1]
            const lastPaidDate = new Date(lastPaidTransaction.date)
            lastPaidDate.setHours(0, 0, 0, 0)
            
            // Se a data calculada está no passado ou muito próxima da última paga,
            // calcular a partir da última paga + 1 mês
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (parcelDate < today || parcelDate <= lastPaidDate) {
              const monthsAfterLast = parcelNumber - paidCount
              const adjustedDate = new Date(lastPaidDate)
              adjustedDate.setMonth(adjustedDate.getMonth() + monthsAfterLast)
              adjustedDate.setHours(0, 0, 0, 0)
              
              // Usar a data ajustada se for futura
              if (adjustedDate >= today) {
                parcelDate.setTime(adjustedDate.getTime())
              }
            }
          }
          
          // Verificar se a parcela está no mês atual
          if (parcelDate >= startDate && parcelDate <= endDate) {
            pendingInstallments.push({
              id: `installment-${installment.id}-${parcelNumber}`,
              type: 'EXPENSE',
              description: `${installment.description} - Parcela ${parcelNumber}/${installment.installments}`,
              amount: installmentAmount,
              date: parcelDate,
              scheduledDate: parcelDate,
              category: installment.category,
              isInstallment: true,
              installmentId: installment.id,
              installmentNumber: parcelNumber,
            })
          }
        }
      }
    })

    // Buscar transações recorrentes com próximas execuções no mês
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId: user.id,
        isActive: true,
        nextDueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    })

    // Converter recorrentes para formato de transação
    const recurringAsTransactions = recurringTransactions.map((rt) => ({
      id: `recurring-${rt.id}`,
      type: rt.type,
      description: rt.description,
      amount: rt.amount,
      date: rt.nextDueDate,
      scheduledDate: rt.nextDueDate,
      category: rt.category,
      isRecurring: true,
      recurringId: rt.id,
      frequency: rt.frequency,
    }))

    // Agrupar todas as transações por dia
    const transactionsByDay: Record<string, any[]> = {}
    const scheduledByDay: Record<string, any[]> = {}
    const pendingByDay: Record<string, any[]> = {}
    
    // Transações confirmadas
    transactions.forEach((transaction) => {
      const dateKey = transaction.date.toISOString().split('T')[0]
      if (!transactionsByDay[dateKey]) {
        transactionsByDay[dateKey] = []
      }
      transactionsByDay[dateKey].push({
        ...transaction,
        status: 'confirmed',
      })
    })

    // Transações agendadas
    scheduledTransactions.forEach((transaction) => {
      const dateKey = new Date(transaction.scheduledDate!).toISOString().split('T')[0]
      if (!scheduledByDay[dateKey]) {
        scheduledByDay[dateKey] = []
      }
      scheduledByDay[dateKey].push({
        ...transaction,
        status: 'scheduled',
      })
    })

    // Parcelamentos pendentes
    pendingInstallments.forEach((installment) => {
      const dateKey = new Date(installment.date).toISOString().split('T')[0]
      if (!pendingByDay[dateKey]) {
        pendingByDay[dateKey] = []
      }
      pendingByDay[dateKey].push({
        ...installment,
        status: 'pending',
      })
    })

    // Transações recorrentes
    recurringAsTransactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0]
      if (!scheduledByDay[dateKey]) {
        scheduledByDay[dateKey] = []
      }
      scheduledByDay[dateKey].push({
        ...transaction,
        status: 'recurring',
      })
    })

    // Calcular totais por dia (confirmadas, agendadas e pendentes)
    const dailyTotals: Record<string, { 
      income: number
      expense: number
      balance: number
      scheduledIncome: number
      scheduledExpense: number
      pendingExpense: number
    }> = {}
    
    // Inicializar todos os dias do mês
    const allDays = new Set<string>()
    Object.keys(transactionsByDay).forEach(d => allDays.add(d))
    Object.keys(scheduledByDay).forEach(d => allDays.add(d))
    Object.keys(pendingByDay).forEach(d => allDays.add(d))
    
    allDays.forEach((date) => {
      const confirmed = transactionsByDay[date] || []
      const scheduled = scheduledByDay[date] || []
      const pending = pendingByDay[date] || []
      
      const income = confirmed
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = confirmed
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const scheduledIncome = scheduled
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const scheduledExpense = scheduled
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const pendingExpense = pending
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      
      dailyTotals[date] = {
        income,
        expense,
        balance: income - expense,
        scheduledIncome,
        scheduledExpense,
        pendingExpense,
      }
    })

    await logToRedis('info', 'Calendário financeiro consultado', {
      userId: user.id,
      year,
      month,
      transactionCount: transactions.length,
    })

    // Combinar todas as transações para exibição
    const allTransactionsByDay: Record<string, any[]> = {}
    
    Object.keys(dailyTotals).forEach((date) => {
      allTransactionsByDay[date] = [
        ...(transactionsByDay[date] || []),
        ...(scheduledByDay[date] || []),
        ...(pendingByDay[date] || []),
      ]
    })

    return NextResponse.json({
      year,
      month,
      transactionsByDay: allTransactionsByDay,
      confirmedByDay: transactionsByDay,
      scheduledByDay,
      pendingByDay,
      dailyTotals,
      totalTransactions: transactions.length,
      totalScheduled: scheduledTransactions.length + recurringAsTransactions.length,
      totalPending: pendingInstallments.length,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar calendário financeiro', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar calendário financeiro' },
      { status: 500 }
    )
  }
}



