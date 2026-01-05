import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface UpdateInfo {
  currentVersion: string
  currentCommit: string
  hasUpdates: boolean
  latestCommit?: string
  latestVersion?: string
  commitsBehind?: number
  branch?: string
  lastChecked?: string
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Ler versão do package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    const currentVersion = packageJson.version || '2.0.0'

    try {
      // Obter commit atual
      const { stdout: currentCommit } = await execAsync('git rev-parse HEAD', {
        cwd: process.cwd(),
        timeout: 5000,
      })

      // Obter branch atual
      const { stdout: currentBranch } = await execAsync('git branch --show-current', {
        cwd: process.cwd(),
        timeout: 5000,
      })

      // Fazer fetch para verificar atualizações
      try {
        await execAsync('git fetch origin', {
          cwd: process.cwd(),
          timeout: 15000,
        })
      } catch (error) {
        // Se falhar o fetch, retornar apenas informações locais
        return NextResponse.json({
          currentVersion,
          currentCommit: currentCommit.trim(),
          branch: currentBranch.trim(),
          hasUpdates: false,
          error: 'Não foi possível verificar atualizações',
        } as UpdateInfo)
      }

      // Verificar se há atualizações
      let hasUpdates = false
      let latestCommit: string | undefined
      let commitsBehind = 0

      try {
        // Obter commit do remote
        const { stdout: remoteCommit } = await execAsync(
          `git rev-parse origin/${currentBranch.trim()}`,
          {
            cwd: process.cwd(),
            timeout: 5000,
          }
        )
        latestCommit = remoteCommit.trim()

        // Verificar se está atrás
        const { stdout: commitsBehindOutput } = await execAsync(
          `git rev-list --count HEAD..origin/${currentBranch.trim()}`,
          {
            cwd: process.cwd(),
            timeout: 5000,
          }
        )
        commitsBehind = parseInt(commitsBehindOutput.trim()) || 0
        hasUpdates = commitsBehind > 0

        // Tentar obter versão do remote (do package.json)
        let latestVersion: string | undefined
        try {
          const { stdout: remotePackageJson } = await execAsync(
            `git show origin/${currentBranch.trim()}:package.json`,
            {
              cwd: process.cwd(),
              timeout: 5000,
            }
          )
          const remotePackage = JSON.parse(remotePackageJson)
          latestVersion = remotePackage.version
        } catch (error) {
          // Se não conseguir, usar a versão atual
          latestVersion = currentVersion
        }

        return NextResponse.json({
          currentVersion,
          currentCommit: currentCommit.trim(),
          branch: currentBranch.trim(),
          hasUpdates,
          latestCommit,
          latestVersion,
          commitsBehind,
          lastChecked: new Date().toISOString(),
        } as UpdateInfo)
      } catch (error) {
        // Se não conseguir comparar, assumir que está atualizado
        return NextResponse.json({
          currentVersion,
          currentCommit: currentCommit.trim(),
          branch: currentBranch.trim(),
          hasUpdates: false,
          error: 'Não foi possível comparar versões',
        } as UpdateInfo)
      }
    } catch (error: any) {
      // Se não for um repositório git, retornar apenas versão
      return NextResponse.json({
        currentVersion,
        hasUpdates: false,
        error: 'Repositório Git não encontrado',
      } as UpdateInfo)
    }
  } catch (error: any) {
    console.error('Erro ao verificar atualizações:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar atualizações', details: error.message },
      { status: 500 }
    )
  }
}

