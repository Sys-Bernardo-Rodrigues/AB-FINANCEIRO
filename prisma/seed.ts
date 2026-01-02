import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário admin padrão (apenas se não existir)
  const adminEmail = 'admin@financeiro.com'
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
      },
    })

    console.log('✅ Usuário admin criado:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Senha: admin123`)
  } else {
    console.log('ℹ️  Usuário admin já existe')
  }

  // Criar categorias padrão para o admin
  const categories = [
    {
      name: 'Salário',
      description: 'Rendimento do trabalho',
      type: 'INCOME' as const,
    },
    {
      name: 'Freelance',
      description: 'Trabalhos freelancer',
      type: 'INCOME' as const,
    },
    {
      name: 'Alimentação',
      description: 'Gastos com comida',
      type: 'EXPENSE' as const,
    },
    {
      name: 'Transporte',
      description: 'Gastos com transporte',
      type: 'EXPENSE' as const,
    },
    {
      name: 'Utilidades',
      description: 'Contas de água, luz, internet',
      type: 'EXPENSE' as const,
    },
    {
      name: 'Lazer',
      description: 'Gastos com entretenimento',
      type: 'EXPENSE' as const,
    },
  ]

  for (const category of categories) {
    // Verificar se a categoria já existe para este usuário
    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        userId: admin!.id,
      },
    })

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          userId: admin!.id,
        },
      })
    }
  }

  console.log('✅ Categorias padrão verificadas/criadas para o admin')
  console.log('✅ Seed concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
