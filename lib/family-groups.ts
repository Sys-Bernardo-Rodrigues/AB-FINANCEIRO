import { prisma } from './prisma'
import { getCurrentUser } from './get-user'

/**
 * Retorna os IDs de todos os usuários que estão no mesmo grupo de família do usuário atual
 * Se o usuário não estiver em nenhum grupo, retorna apenas o ID do próprio usuário
 */
export async function getFamilyGroupUserIds(): Promise<string[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // Buscar grupos onde o usuário é membro
    const memberships = await prisma.familyGroupMember.findMany({
      where: { userId: user.id },
      select: { familyGroupId: true },
    })

    if (memberships.length === 0) {
      // Usuário não está em nenhum grupo, retorna apenas ele mesmo
      return [user.id]
    }

    // Buscar todos os membros dos grupos do usuário
    const groupIds = memberships.map(m => m.familyGroupId)
    const allMembers = await prisma.familyGroupMember.findMany({
      where: {
        familyGroupId: { in: groupIds },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Retornar IDs únicos de todos os membros
    const userIds = Array.from(new Set(allMembers.map(m => m.userId)))
    return userIds
  } catch (error) {
    console.error('Erro ao buscar IDs do grupo de família:', error)
    // Em caso de erro, retorna apenas o ID do usuário atual
    const user = await getCurrentUser()
    return user ? [user.id] : []
  }
}

/**
 * Retorna true se o usuário está em algum grupo de família
 */
export async function isUserInFamilyGroup(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    const membership = await prisma.familyGroupMember.findFirst({
      where: { userId: user.id },
    })

    return !!membership
  } catch (error) {
    console.error('Erro ao verificar grupo de família:', error)
    return false
  }
}






