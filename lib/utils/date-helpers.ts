/**
 * Formata uma data para string no formato YYYY-MM-DD para envio ao backend
 * Mantém o dia correto independente do timezone
 * Não converte para ISO - envia direto no formato YYYY-MM-DD
 */
export function formatDateForAPI(dateString: string): string {
  // Input type="date" já retorna no formato YYYY-MM-DD
  // Se já está no formato correto, retornar direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // Se for um objeto Date ou string ISO, converter para YYYY-MM-DD usando horário local
  const date = typeof dateString === 'string' ? new Date(dateString + 'T00:00:00') : dateString
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Converte uma data ISO do backend para formato YYYY-MM-DD para input type="date"
 * Mantém o dia correto independente do timezone
 */
export function formatDateForInput(isoString: string | Date): string {
  if (!isoString) return ''
  
  // Se já está no formato YYYY-MM-DD, retornar direto
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString
  }
  
  // Se for ISO string (com T ou Z), converter considerando timezone local
  // Extrair apenas a parte da data antes do T
  let dateStr = typeof isoString === 'string' ? isoString : isoString.toISOString()
  
  // Se tem T, pegar apenas a parte antes do T
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0]
  }
  
  // Se já está no formato correto após split, retornar
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Validar se a data está correta no timezone local
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }
  
  // Fallback: converter normalmente
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

