import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { deleteFile } from '@/lib/file-upload'

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

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
            date: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Comprovante não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(receipt)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar comprovante', {
      receiptId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar comprovante' },
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
    const { transactionId } = body

    const existing = await prisma.receipt.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Comprovante não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a transação existe e pertence ao usuário
    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: user.id,
        },
      })

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transação não encontrada' },
          { status: 404 }
        )
      }
    }

    const updated = await prisma.receipt.update({
      where: { id: params.id },
      data: {
        transactionId: transactionId || null,
      },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
          },
        },
      },
    })

    await logToRedis('info', 'Comprovante atualizado', {
      userId: user.id,
      receiptId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    await logToRedis('error', 'Erro ao atualizar comprovante', {
      receiptId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar comprovante' },
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

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Comprovante não encontrado' },
        { status: 404 }
      )
    }

    // Deletar arquivo físico
    await deleteFile(receipt.filename)

    // Deletar registro no banco
    await prisma.receipt.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Comprovante deletado', {
      userId: user.id,
      receiptId: params.id,
    })

    return NextResponse.json({ message: 'Comprovante deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar comprovante', {
      receiptId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar comprovante' },
      { status: 500 }
    )
  }
}





