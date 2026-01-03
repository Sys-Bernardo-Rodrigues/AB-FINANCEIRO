import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const GITHUB_REPO = 'https://github.com/Sys-Bernardo-Rodrigues/AB-FINANCEIRO.git'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    await logToRedis('info', 'Iniciando atualização do sistema', {
      userId: user.id,
      email: user.email,
    })

    const steps: Array<{ step: string; status: 'success' | 'error'; message: string }> = []

    try {
      // Passo 1: Git fetch
      try {
        const { stdout: fetchOutput } = await execAsync('git fetch origin', {
          cwd: process.cwd(),
          timeout: 30000, // 30 segundos
        })
        steps.push({ step: 'fetch', status: 'success', message: 'Fetch executado com sucesso' })
      } catch (error: any) {
        steps.push({ 
          step: 'fetch', 
          status: 'error', 
          message: `Erro no fetch: ${error.message}` 
        })
        throw error
      }

      // Passo 2: Git pull
      try {
        const { stdout: pullOutput } = await execAsync('git pull origin main', {
          cwd: process.cwd(),
          timeout: 30000, // 30 segundos
        })
        steps.push({ step: 'pull', status: 'success', message: pullOutput.trim() || 'Pull executado com sucesso' })
      } catch (error: any) {
        // Se já está atualizado, não é um erro crítico
        if (error.message.includes('Already up to date')) {
          steps.push({ step: 'pull', status: 'success', message: 'Sistema já está atualizado' })
        } else {
          steps.push({ 
            step: 'pull', 
            status: 'error', 
            message: `Erro no pull: ${error.message}` 
          })
          throw error
        }
      }

      // Passo 3: npm install (se necessário)
      try {
        const { stdout: installOutput } = await execAsync('npm install', {
          cwd: process.cwd(),
          timeout: 120000, // 2 minutos
        })
        steps.push({ step: 'install', status: 'success', message: 'Dependências instaladas com sucesso' })
      } catch (error: any) {
        steps.push({ 
          step: 'install', 
          status: 'error', 
          message: `Erro na instalação: ${error.message}` 
        })
        // Não falhar completamente se o install falhar
      }

      // Passo 4: Prisma generate
      try {
        const { stdout: prismaOutput } = await execAsync('npx prisma generate', {
          cwd: process.cwd(),
          timeout: 60000, // 1 minuto
        })
        steps.push({ step: 'prisma', status: 'success', message: 'Prisma atualizado com sucesso' })
      } catch (error: any) {
        steps.push({ 
          step: 'prisma', 
          status: 'error', 
          message: `Erro no Prisma: ${error.message}` 
        })
        // Não falhar completamente se o prisma falhar
      }

      await logToRedis('info', 'Atualização do sistema concluída', {
        userId: user.id,
        steps: steps.map(s => s.step),
      })

      return NextResponse.json({
        success: true,
        message: 'Sistema atualizado com sucesso',
        steps,
        requiresRestart: true,
      })
    } catch (error: any) {
      await logToRedis('error', 'Erro na atualização do sistema', {
        userId: user.id,
        error: String(error),
        steps,
      })

      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar o sistema',
        steps,
        error: error.message,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro na atualização:', error)
    return NextResponse.json(
      { error: 'Erro ao processar atualização', details: error.message },
      { status: 500 }
    )
  }
}


