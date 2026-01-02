const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('Testando conexão...')
    await prisma.$connect()
    console.log('✅ Conexão bem-sucedida!')
    
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('Versão do PostgreSQL:', result[0].version)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
    process.exit(1)
  }
}

testConnection()

