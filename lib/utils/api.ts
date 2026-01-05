const API_BASE = '/api'

export interface ApiError {
  error: string
  details?: Array<{
    field: string
    message: string
  }>
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRedirect: boolean = false
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && !skipAuthRedirect) {
      // Redirecionar para login se não autenticado (exceto quando skipAuthRedirect = true)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
      }
      throw new Error('Não autenticado')
    }

    const error: ApiError = await response.json()
    throw new Error(error.error || 'Erro na requisição')
  }

  return response.json()
}

export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {},
  skipAuthRedirect: boolean = false
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method: options.method || 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    if (response.status === 401 && !skipAuthRedirect) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
      }
      throw new Error('Não autenticado')
    }

    const error: ApiError = await response.json()
    throw new Error(error.error || 'Erro na requisição')
  }

  return response.json()
}

