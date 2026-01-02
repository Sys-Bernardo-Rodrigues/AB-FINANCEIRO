import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logToRedis } from '@/lib/redis'

// Endpoint para sincronizar todos os planos do sistema
// Útil para corrigir inconsistências em massa
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

    // Buscar todos os planos ativos
    const plans = await prisma.plan.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
          },
        },
      },
    })

    let syncedCount = 0
    let fixedCount = 0
    const fixes: Array<{ planId: string; previousAmount: number; newAmount: number }> = []

    for (const plan of plans) {
      try {
        const calculatedAmount = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
        const difference = Math.abs(calculatedAmount - plan.currentAmount)
        
        // Se houver diferença significativa (> 0.01), sincronizar
        if (difference > 0.01) {
          const isCompleted = calculatedAmount >= plan.targetAmount

          await prisma.plan.update({
            where: { id: plan.id },
            data: {
              currentAmount: calculatedAmount,
              status: isCompleted ? 'COMPLETED' : plan.status,
            },
          })

          fixes.push({
            planId: plan.id,
            previousAmount: plan.currentAmount,
            newAmount: calculatedAmount,
          })

          fixedCount++
        }

        syncedCount++
      } catch (error) {
        await logToRedis('error', 'Erro ao sincronizar plano específico', {
          planId: plan.id,
          error: String(error),
        })
        // Continuar processando outros planos
      }
    }

    await logToRedis('info', 'Sincronização em massa de planos concluída', {
      totalPlans: plans.length,
      syncedCount,
      fixedCount,
    })

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      totalPlans: plans.length,
      syncedCount,
      fixedCount,
      fixes: fixes.slice(0, 10), // Limitar a 10 para não sobrecarregar a resposta
    })
  } catch (error) {
    await logToRedis('error', 'Erro na sincronização em massa de planos', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao sincronizar planos' },
      { status: 500 }
    )
  }
}

// GET para verificar status sem sincronizar
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
          },
        },
      },
    })

    let needsSyncCount = 0
    const needsSync: Array<{ planId: string; difference: number }> = []

    for (const plan of plans) {
      const calculatedAmount = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
      const difference = Math.abs(calculatedAmount - plan.currentAmount)
      
      if (difference > 0.01) {
        needsSyncCount++
        needsSync.push({
          planId: plan.id,
          difference,
        })
      }
    }

    return NextResponse.json({
      totalPlans: plans.length,
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


