import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import * as XLSX from 'xlsx'

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
    const format = searchParams.get('format') || 'xlsx'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construir filtros de data
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        category: true,
      },
    })

    // Calcular totais
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    // Agrupar por categoria
    const categoryData: Record<string, { income: number; expense: number }> = {}
    transactions.forEach((t) => {
      const catName = t.category.name
      if (!categoryData[catName]) {
        categoryData[catName] = { income: 0, expense: 0 }
      }
      if (t.type === 'INCOME') {
        categoryData[catName].income += t.amount
      } else {
        categoryData[catName].expense += t.amount
      }
    })

    const categoryRows = Object.entries(categoryData).map(([category, data]) => ({
      Categoria: category,
      Receitas: data.income.toFixed(2),
      Despesas: data.expense.toFixed(2),
      Saldo: (data.income - data.expense).toFixed(2),
    }))

    // Agrupar por mês
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 }
      }
      if (t.type === 'INCOME') {
        monthlyData[month].income += t.amount
      } else {
        monthlyData[month].expense += t.amount
      }
    })

    const monthlyRows = Object.entries(monthlyData)
      .sort(([a], [b]) => {
        const dateA = new Date(a)
        const dateB = new Date(b)
        return dateA.getTime() - dateB.getTime()
      })
      .map(([month, data]) => ({
        Mês: month,
        Receitas: data.income.toFixed(2),
        Despesas: data.expense.toFixed(2),
        Saldo: (data.income - data.expense).toFixed(2),
      }))

    await logToRedis('info', 'Relatório exportado', {
      userId: user.id,
      format,
    })

    if (format === 'xlsx') {
      // Criar workbook com múltiplas abas
      const workbook = XLSX.utils.book_new()

      // Aba 1: Resumo
      const summaryData = [
        { Métrica: 'Total de Receitas', Valor: totalIncome.toFixed(2) },
        { Métrica: 'Total de Despesas', Valor: totalExpenses.toFixed(2) },
        { Métrica: 'Saldo', Valor: balance.toFixed(2) },
        { Métrica: 'Total de Transações', Valor: transactions.length.toString() },
      ]
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

      // Aba 2: Por Categoria
      if (categoryRows.length > 0) {
        const categorySheet = XLSX.utils.json_to_sheet(categoryRows)
        categorySheet['!cols'] = [
          { wch: 25 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
        ]
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoria')
      }

      // Aba 3: Por Mês
      if (monthlyRows.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(monthlyRows)
        monthlySheet['!cols'] = [
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
        ]
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Por Mês')
      }

      // Aba 4: Todas as Transações
      const transactionsData = transactions.map((t) => ({
        Data: new Date(t.date).toLocaleDateString('pt-BR'),
        Descrição: t.description,
        Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
        Categoria: t.category.name,
        Valor: t.amount.toFixed(2),
      }))
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
      transactionsSheet['!cols'] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 10 },
        { wch: 20 },
        { wch: 12 },
      ]
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transações')

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    } else {
      // CSV simples (apenas resumo)
      const csvRows = [
        'Métrica,Valor',
        `Total de Receitas,${totalIncome.toFixed(2)}`,
        `Total de Despesas,${totalExpenses.toFixed(2)}`,
        `Saldo,${balance.toFixed(2)}`,
        `Total de Transações,${transactions.length}`,
      ]

      const csv = csvRows.join('\n')
      const csvBuffer = Buffer.from('\ufeff' + csv, 'utf-8')

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    await logToRedis('error', 'Erro ao exportar relatório', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao exportar relatório' },
      { status: 500 }
    )
  }
}

