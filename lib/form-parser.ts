import { NextRequest } from 'next/server'
import { IncomingForm } from 'formidable'
import { Readable } from 'stream'

export interface ParsedFile {
  buffer: Buffer
  originalFilename: string
  mimetype: string
  size: number
}

export interface ParsedFormData {
  file?: ParsedFile
  transactionId?: string
  [key: string]: any
}

export async function parseFormData(
  request: NextRequest
): Promise<ParsedFormData> {
  const formData = await request.formData()
  const result: ParsedFormData = {}

  // Processar campos de texto
  for (const [key, value] of formData.entries()) {
    if (key !== 'file' && typeof value === 'string') {
      result[key] = value
    }
  }

  // Processar arquivo
  const file = formData.get('file') as File | null
  if (file) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    result.file = {
      buffer,
      originalFilename: file.name,
      mimetype: file.type,
      size: file.size,
    }
  }

  return result
}

