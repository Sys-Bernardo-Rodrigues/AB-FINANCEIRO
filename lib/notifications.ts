import { prisma } from './prisma'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  relatedId?: string
  relatedType?: string
  actionUrl?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        userId: params.userId,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        actionUrl: params.actionUrl,
      },
    })
    return notification
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return null
  }
}

// Funções auxiliares para criar notificações específicas
export async function notifyLowBalance(userId: string, balance: number) {
  return createNotification({
    userId,
    title: 'Saldo Baixo',
    message: `Seu saldo está negativo: ${balance.toFixed(2)}. Considere revisar suas despesas.`,
    type: 'DANGER',
    actionUrl: '/transactions',
  })
}

export async function notifyUpcomingRecurring(userId: string, description: string, date: Date) {
  return createNotification({
    userId,
    title: 'Transação Recorrente Próxima',
    message: `${description} vence em ${date.toLocaleDateString('pt-BR')}`,
    type: 'WARNING',
    actionUrl: '/recurring',
  })
}

export async function notifyGoalProgress(userId: string, goalName: string, progress: number) {
  if (progress >= 80 && progress < 100) {
    return createNotification({
      userId,
      title: 'Meta Quase Completa!',
      message: `Você está a ${100 - progress}% de completar a meta "${goalName}"`,
      type: 'SUCCESS',
      actionUrl: '/savings-goals',
    })
  }
  return null
}

export async function notifyGoalCompleted(userId: string, goalName: string) {
  return createNotification({
    userId,
    title: 'Meta Concluída! 🎉',
    message: `Parabéns! Você completou a meta "${goalName}"`,
    type: 'SUCCESS',
    actionUrl: '/savings-goals',
  })
}

export async function notifyHighExpense(userId: string, category: string, amount: number, average: number) {
  if (amount > average * 1.5) {
    return createNotification({
      userId,
      title: 'Gasto Acima da Média',
      message: `Você gastou ${amount.toFixed(2)} em ${category}, acima da média de ${average.toFixed(2)}`,
      type: 'WARNING',
      actionUrl: '/reports',
    })
  }
  return null
}



