import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getFamilyGroupUserIds } from '@/lib/family-groups'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateCreditCardSchema = z.object({
  name: z.string().min(1).optional(),
  limit: z.number().positive().optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(creditCard)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar cartão de crédito', {
      creditCardId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar cartão de crédito' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateCreditCardSchema.parse(body)

    const existingCard = await prisma.creditCard.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.limit !== undefined) updateData.limit = data.limit
    if (data.paymentDay !== undefined) updateData.paymentDay = data.paymentDay

    const updated = await prisma.creditCard.update({
      where: { id: params.id },
      data: updateData,
    })

    await logToRedis('info', 'Cartão de crédito atualizado', {
      userId: user.id,
      creditCardId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar cartão de crédito', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar cartão de crédito', {
      creditCardId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar cartão de crédito' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      )
    }

    await prisma.creditCard.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Cartão de crédito deletado', {
      userId: user.id,
      creditCardId: params.id,
    })

    return NextResponse.json({ message: 'Cartão de crédito deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar cartão de crédito', {
      creditCardId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar cartão de crédito' },
      { status: 500 }
    )
  }
}

