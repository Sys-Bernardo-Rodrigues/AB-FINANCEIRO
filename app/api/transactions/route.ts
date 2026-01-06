import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { notifyHighExpense } from '@/lib/notifications'
import { parseLocalDate } from '@/lib/utils/format'
import { z } from 'zod'

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid('Categoria inválida'),
  date: z.string().optional(),
  userId: z.string().uuid('Usuário inválido').optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  planId: z.string().uuid('Plano inválido').optional(),
  installmentId: z.string().uuid('Parcelamento inválido').optional(),
  creditCardId: z.string().uuid('Cartão de crédito inválido').optional(),
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
    const type = searchParams.get('type')
    const allUsers = searchParams.get('allUsers') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    // Importar função para obter IDs do grupo de família
    const { getFamilyGroupUserIds } = await import('@/lib/family-groups')
    const familyUserIds = await getFamilyGroupUserIds()

    // Se allUsers for true, não filtrar por userId (mostrar todas)
    // Caso contrário, mostrar apenas do grupo de família
    const where: any = allUsers ? {} : { userId: { in: familyUserIds } }
    if (type) {
      where.type = type as 'INCOME' | 'EXPENSE'
    }
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive' as const,
      }
    }
    if (categoryId) {
      where.categoryId = categoryId
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
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creditCard: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    await logToRedis('info', 'Transações listadas', {
      userId: user.id,
      count: transactions.length,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar transações', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
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
    
    // Limpar campos vazios opcionais
    if (body.creditCardId === '') {
      delete body.creditCardId
    }
    if (body.planId === '') {
      delete body.planId
    }
    if (body.installmentId === '') {
      delete body.installmentId
    }
    
    // Validar dados
    let data
    try {
      data = transactionSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await logToRedis('warn', 'Validação falhou ao criar transação', {
          errors: error.errors,
          body,
        })
        return NextResponse.json(
          { 
            error: 'Dados inválidos', 
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }

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

        const transactionDate = data.date ? parseLocalDate(data.date) : new Date()
        const isScheduled = data.isScheduled && data.scheduledDate && parseLocalDate(data.scheduledDate) > new Date()
        
        // Verificar se planId é válido (se fornecido)
        if (data.planId) {
          const plan = await prisma.plan.findFirst({
            where: {
              id: data.planId,
              userId: targetUserId,
              status: 'ACTIVE',
            },
          })
          
          if (!plan) {
            return NextResponse.json(
              { error: 'Plano não encontrado ou inativo' },
              { status: 404 }
            )
          }
        }

        // Verificar se installmentId é válido (se fornecido)
        if (data.installmentId) {
          const installment = await prisma.installment.findFirst({
            where: {
              id: data.installmentId,
              userId: targetUserId,
              status: 'ACTIVE',
            },
          })
          
          if (!installment) {
            return NextResponse.json(
              { error: 'Parcelamento não encontrado ou inativo' },
              { status: 404 }
            )
          }
        }

        // Verificar se creditCardId é válido (se fornecido)
        if (data.creditCardId) {
          const creditCard = await prisma.creditCard.findFirst({
            where: {
              id: data.creditCardId,
              userId: targetUserId,
            },
          })
          
          if (!creditCard) {
            return NextResponse.json(
              { error: 'Cartão de crédito não encontrado' },
              { status: 404 }
            )
          }
        }
        
        const transaction = await prisma.transaction.create({
          data: {
            description: data.description,
            amount: data.amount,
            type: data.type,
            categoryId: data.categoryId,
            userId: targetUserId,
            date: transactionDate,
            isScheduled: isScheduled || false,
            scheduledDate: isScheduled && data.scheduledDate ? parseLocalDate(data.scheduledDate) : null,
            planId: data.planId || null,
            installmentId: data.installmentId || null,
            isInstallment: !!data.installmentId,
            creditCardId: data.creditCardId || null,
          },
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            plan: true,
            installment: true,
            creditCard: true,
            receipts: {
              orderBy: {
                uploadedAt: 'desc',
              },
            },
          },
        })

        // Atualizar Plan.currentAmount se transação estiver vinculada a um plano
        if (data.planId && transaction.type === 'EXPENSE') {
          const plan = await prisma.plan.findUnique({
            where: { id: data.planId },
          })

          if (plan) {
            const newCurrentAmount = plan.currentAmount + transaction.amount
            const isCompleted = newCurrentAmount >= plan.targetAmount

            await prisma.plan.update({
              where: { id: data.planId },
              data: {
                currentAmount: newCurrentAmount,
                status: isCompleted ? 'COMPLETED' : plan.status,
              },
            })

            await logToRedis('info', 'Plano atualizado automaticamente', {
              planId: data.planId,
              newCurrentAmount,
              isCompleted,
            })
          }
        }

        // Verificar gasto acima da média e criar notificação
        if (transaction.type === 'EXPENSE') {
          try {
            const categoryTransactions = await prisma.transaction.findMany({
              where: {
                categoryId: transaction.categoryId,
                userId: targetUserId,
                type: 'EXPENSE',
                date: {
                  gte: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Últimos 3 meses
                },
              },
            })

            if (categoryTransactions.length > 0) {
              const average = categoryTransactions.reduce((sum, t) => sum + t.amount, 0) / categoryTransactions.length
              await notifyHighExpense(targetUserId, transaction.category.name, transaction.amount, average)
            }
          } catch (error) {
            // Não falhar a criação da transação se a notificação falhar
            console.error('Erro ao verificar gasto acima da média:', error)
          }
        }

        await logToRedis('info', 'Transação criada', {
          userId: user.id,
          transactionId: transaction.id,
          type: transaction.type,
          planId: data.planId || null,
        })

        return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    // Se já foi tratado anteriormente (validação Zod), não tratar novamente
    if (error instanceof z.ZodError && error.errors.length > 0) {
      // Já foi tratado no início
      throw error
    }

    await logToRedis('error', 'Erro ao criar transação', { 
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    
    console.error('Erro ao criar transação:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar transação',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
