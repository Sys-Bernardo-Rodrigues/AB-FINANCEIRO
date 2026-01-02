import { cookies } from 'next/headers'
import { getUserFromToken } from './auth'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  return await getUserFromToken(token)
}

