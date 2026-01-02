import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logToRedis } from '@/lib/redis'

// Endpoint para sincronizar todos os parcelamentos do sistema
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar todos os parcelamentos ativos
    const installments = await prisma.installment.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
      },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    let syncedCount = 0
    let fixedCount = 0
    const fixes: Array<{ installmentId: string; previousInstallment: number; newInstallment: number }> = []

    for (const installment of installments) {
      try {
        const calculatedInstallment = installment.transactions.length
        const difference = Math.abs(calculatedInstallment - installment.currentInstallment)
        
        // Se houver diferença, sincronizar
        if (difference > 0) {
          const isCompleted = calculatedInstallment >= installment.installments

          await prisma.installment.update({
            where: { id: installment.id },
            data: {
              currentInstallment: calculatedInstallment,
              status: isCompleted ? 'COMPLETED' : installment.status,
            },
          })

          fixes.push({
            installmentId: installment.id,
            previousInstallment: installment.currentInstallment,
            newInstallment: calculatedInstallment,
          })

          fixedCount++
        }

        syncedCount++
      } catch (error) {
        await logToRedis('error', 'Erro ao sincronizar parcelamento específico', {
          installmentId: installment.id,
          error: String(error),
        })
        // Continuar processando outros parcelamentos
      }
    }

    await logToRedis('info', 'Sincronização em massa de parcelamentos concluída', {
      totalInstallments: installments.length,
      syncedCount,
      fixedCount,
    })

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      totalInstallments: installments.length,
      syncedCount,
      fixedCount,
      fixes: fixes.slice(0, 10), // Limitar a 10 para não sobrecarregar a resposta
    })
  } catch (error) {
    await logToRedis('error', 'Erro na sincronização em massa de parcelamentos', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao sincronizar parcelamentos' },
      { status: 500 }
    )
  }
}

// GET para verificar status sem sincronizar
export async function GET() {
  try {
    const installments = await prisma.installment.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
      },
      include: {
        transactions: true,
      },
    })

    let needsSyncCount = 0
    const needsSync: Array<{ installmentId: string; difference: number }> = []

    for (const installment of installments) {
      const calculatedInstallment = installment.transactions.length
      const difference = Math.abs(calculatedInstallment - installment.currentInstallment)
      
      if (difference > 0) {
        needsSyncCount++
        needsSync.push({
          installmentId: installment.id,
          difference,
        })
      }
    }

    return NextResponse.json({
      totalInstallments: installments.length,
      needsSyncCount,
      needsSync: needsSync.slice(0, 10),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

