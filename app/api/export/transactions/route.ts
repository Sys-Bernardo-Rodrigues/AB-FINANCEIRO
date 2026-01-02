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
    const format = searchParams.get('format') || 'csv' // csv ou xlsx
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    // Construir filtros
    const where: any = { userId: user.id }
    if (type && type !== 'ALL') {
      where.type = type
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Preparar dados para exportação
    const exportData = transactions.map((t) => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Descrição: t.description,
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: t.category.name,
      Valor: t.amount.toFixed(2),
      'Valor Formatado': new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(t.amount),
    }))

    await logToRedis('info', 'Transações exportadas', {
      userId: user.id,
      format,
      count: transactions.length,
    })

    if (format === 'xlsx') {
      // Exportar como Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações')

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 12 }, // Data
        { wch: 30 }, // Descrição
        { wch: 10 }, // Tipo
        { wch: 20 }, // Categoria
        { wch: 12 }, // Valor
        { wch: 15 }, // Valor Formatado
      ]
      worksheet['!cols'] = colWidths

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="transacoes_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    } else {
      // Exportar como CSV
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row]
              // Escapar vírgulas e aspas
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(',')
        ),
      ]

      const csv = csvRows.join('\n')
      const csvBuffer = Buffer.from('\ufeff' + csv, 'utf-8') // BOM para Excel reconhecer UTF-8

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transacoes_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    await logToRedis('error', 'Erro ao exportar transações', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao exportar transações' },
      { status: 500 }
    )
  }
}



