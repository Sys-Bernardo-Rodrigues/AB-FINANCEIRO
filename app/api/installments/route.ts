import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const installmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  totalAmount: z.number().positive('Valor deve ser positivo'),
  installments: z.number().int().min(2, 'Mínimo 2 parcelas'),
  categoryId: z.string().uuid('Categoria inválida'),
  startDate: z.string().optional(),
  userId: z.string().uuid('Usuário inválido').optional(),
})

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
    const status = searchParams.get('status')

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const installments = await prisma.installment.findMany({
      where,
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    await logToRedis('info', 'Parcelamentos listados', {
      userId: user.id,
      count: installments.length,
    })

    return NextResponse.json(installments)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar parcelamentos', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao buscar parcelamentos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = installmentSchema.parse(body)

    // Usar o userId fornecido ou o do usuário autenticado
    const targetUserId = data.userId || user.id

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const installmentAmount = data.totalAmount / data.installments

    // Criar o parcelamento
    const installment = await prisma.installment.create({
      data: {
        description: data.description,
        totalAmount: data.totalAmount,
        installments: data.installments,
        categoryId: data.categoryId,
        userId: targetUserId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
      },
      include: {
        category: true,
      },
    })

    // Criar a primeira parcela
    const firstTransaction = await prisma.transaction.create({
      data: {
        description: `${data.description} (1/${data.installments})`,
        amount: installmentAmount,
        type: 'EXPENSE',
        categoryId: data.categoryId,
        userId: targetUserId,
        date: data.startDate ? new Date(data.startDate) : new Date(),
        isInstallment: true,
        installmentId: installment.id,
      },
    })

    await logToRedis('info', 'Parcelamento criado', {
      userId: user.id,
      installmentId: installment.id,
      installments: data.installments,
    })

    return NextResponse.json(
      { ...installment, transactions: [firstTransaction] },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar parcelamento', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar parcelamento', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao criar parcelamento' },
      { status: 500 }
    )
  }
}
