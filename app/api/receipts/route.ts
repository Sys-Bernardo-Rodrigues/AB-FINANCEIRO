import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { parseFormData } from '@/lib/form-parser'
import { validateFile, saveFile } from '@/lib/file-upload'

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
    const transactionId = searchParams.get('transactionId')

    const where: any = { userId: user.id }
    if (transactionId) {
      where.transactionId = transactionId
    }

    const receipts = await prisma.receipt.findMany({
      where,
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
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    await logToRedis('info', 'Comprovantes listados', {
      userId: user.id,
      count: receipts.length,
    })

    return NextResponse.json(receipts)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar comprovantes', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar comprovantes' },
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

    const formData = await parseFormData(request)
    const file = formData.file
    const transactionId = formData.transactionId

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Validar arquivo
    validateFile(file)

    // Salvar arquivo
    const uploadResult = await saveFile({
      buffer: file.buffer,
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
    })

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

    // Criar registro no banco
    const receipt = await prisma.receipt.create({
      data: {
        filename: uploadResult.filename,
        originalFilename: uploadResult.originalFilename,
        url: uploadResult.url,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        userId: user.id,
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

    await logToRedis('info', 'Comprovante criado', {
      userId: user.id,
      receiptId: receipt.id,
      transactionId: transactionId || null,
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error: any) {
    await logToRedis('error', 'Erro ao criar comprovante', {
      error: String(error),
    })
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload do comprovante' },
      { status: 500 }
    )
  }
}






