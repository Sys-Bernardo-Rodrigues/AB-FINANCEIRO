import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Registro público desabilitado - usuários só podem ser criados dentro do sistema
  return NextResponse.json(
    { error: 'Registro público desabilitado. Usuários devem ser criados dentro do sistema.' },
    { status: 403 }
  )
}

