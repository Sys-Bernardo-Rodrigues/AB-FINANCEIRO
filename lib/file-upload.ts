import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'receipts')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export interface UploadResult {
  filename: string
  originalFilename: string
  url: string
  mimeType: string
  size: number
}

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export function validateFile(file: { size: number; mimetype: string }) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 10MB')
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(
      'Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou PDF'
    )
  }
}

export async function saveFile(
  file: { buffer: Buffer; originalFilename: string; mimetype: string }
): Promise<UploadResult> {
  await ensureUploadDir()

  const timestamp = Date.now()
  const sanitizedFilename = file.originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
  const extension = sanitizedFilename.split('.').pop()
  const filename = `${timestamp}_${sanitizedFilename}`
  const filepath = join(UPLOAD_DIR, filename)

  await writeFile(filepath, file.buffer)

  return {
    filename,
    originalFilename: file.originalFilename,
    url: `/uploads/receipts/${filename}`,
    mimeType: file.mimetype,
    size: file.buffer.length,
  }
}

export async function deleteFile(filename: string) {
  const filepath = join(UPLOAD_DIR, filename)
  if (existsSync(filepath)) {
    const { unlink } = await import('fs/promises')
    return unlink(filepath)
  }
}

