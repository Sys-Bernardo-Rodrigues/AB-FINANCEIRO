export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  // Converter para Date object e garantir que mantém o dia correto
  let dateObj: Date
  if (typeof date === 'string') {
    // Se é formato YYYY-MM-DD, criar data local diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(year, month - 1, day)
    } else {
      // Para ISO strings (com T ou Z), extrair componentes e criar data local
      const isoDate = new Date(date)
      // Criar nova data usando componentes locais para evitar mudança de dia
      dateObj = new Date(
        isoDate.getFullYear(),
        isoDate.getMonth(),
        isoDate.getDate()
      )
    }
  } else {
    dateObj = date
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'agora'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
  }

  return formatDate(date)
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Converte uma string de data no formato "YYYY-MM-DD" para um objeto Date
 * usando o horário local (meia-noite no timezone local), evitando problemas de timezone
 */
export function parseLocalDate(dateString: string): Date {
  // Se a string já incluir hora, usar diretamente
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString)
  }
  
  // Para formato "YYYY-MM-DD", criar data usando horário local
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}




