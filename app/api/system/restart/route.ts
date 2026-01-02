import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    await logToRedis('info', 'Solicitação de reinicialização do sistema', {
      userId: user.id,
      email: user.email,
    })

    try {
      // Tentar reiniciar via systemd (método mais comum em produção)
      // Nota: systemctl geralmente requer sudo, mas tentamos primeiro sem
      try {
        // Tentar restart sem sudo (pode funcionar se o usuário tiver permissões)
        await execAsync('systemctl restart financeiro.service', {
          timeout: 10000,
        })
        
        await logToRedis('info', 'Sistema reiniciado via systemd', {
          userId: user.id,
          method: 'systemd',
        })

        return NextResponse.json({
          success: true,
          message: 'Sistema reiniciado com sucesso via systemd',
          method: 'systemd',
        })
      } catch (systemdError: any) {
        // Se systemd não funcionar, tentar outras formas
        
        // Tentar via PM2 (se estiver usando)
        try {
          await execAsync('pm2 restart financeiro || pm2 restart all', {
            timeout: 10000,
          })
          
          await logToRedis('info', 'Sistema reiniciado via PM2', {
            userId: user.id,
            method: 'pm2',
          })

          return NextResponse.json({
            success: true,
            message: 'Sistema reiniciado com sucesso via PM2',
            method: 'pm2',
          })
        } catch (pm2Error: any) {
          // Se PM2 também não funcionar, informar que precisa de sudo
          await logToRedis('warn', 'Reinicialização automática requer privilégios sudo', {
            userId: user.id,
            systemdError: String(systemdError.message || systemdError),
          })

          return NextResponse.json({
            success: false,
            message: 'Reinicialização automática requer privilégios administrativos. Execute no servidor:',
            error: 'Privilégios insuficientes',
            requiresManual: true,
            instructions: 'sudo systemctl restart financeiro.service',
          }, { status: 403 })
        }
      }
    } catch (error: any) {
      await logToRedis('error', 'Erro ao tentar reiniciar o sistema', {
        userId: user.id,
        error: String(error),
      })

      return NextResponse.json({
        success: false,
        message: 'Erro ao reiniciar o sistema',
        error: error.message,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro no processo de reinicialização:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de reinicialização', details: error.message },
      { status: 500 }
    )
  }
}

