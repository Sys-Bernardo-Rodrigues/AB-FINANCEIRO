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
    const status = searchParams.get('status') // 'pending', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: user.id,
      isScheduled: true,
    }

    if (status === 'pending') {
      where.scheduledDate = {
        gte: new Date(),
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: limit,
    })

    await logToRedis('info', 'Transações agendadas listadas', {
      userId: user.id,
      count: transactions.length,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar transações agendadas', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar transações agendadas' },
      { status: 500 }
    )
  }
}




