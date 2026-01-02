// Script para gerar ícones a partir do teste-ab.png
// Execute: node scripts/generate-icons-from-png.js

const fs = require('fs')
const path = require('path')

const sourcePath = path.join(__dirname, '..', 'ICON', 'teste-ab.png')
const publicDir = path.join(__dirname, '..', 'public')

// Verificar se o arquivo fonte existe
if (!fs.existsSync(sourcePath)) {
  console.error('❌ Arquivo teste-ab.png não encontrado em ICON/')
  process.exit(1)
}

// Tamanhos necessários
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-icon-180x180.png', size: 180 },
  { name: 'favicon.png', size: 32 }, // Favicon básico
]

console.log('🎨 Gerando ícones a partir de teste-ab.png...\n')

// Tentar usar sharp para redimensionar
let sharp
try {
  sharp = require('sharp')
  console.log('✅ Sharp encontrado, redimensionando automaticamente...\n')
} catch (e) {
  console.log('⚠️  Sharp não encontrado.')
  console.log('📦 Instalando sharp...\n')
  console.log('Execute: npm install sharp --save-dev\n')
  console.log('Ou copiando arquivo sem redimensionar...\n')
  
  // Se não tiver sharp, copiar o arquivo para todos os tamanhos
  // (não ideal, mas funciona)
  sizes.forEach(({ name }) => {
    const destPath = path.join(publicDir, name)
    fs.copyFileSync(sourcePath, destPath)
    console.log(`✅ Copiado: ${name} (mesmo tamanho)`)
  })
  
  console.log('\n⚠️  Nota: Os ícones foram copiados sem redimensionar.')
  console.log('💡 Para redimensionar corretamente, instale sharp e execute novamente.\n')
  process.exit(0)
}

// Se sharp estiver disponível, redimensionar
async function generateIcons() {
  try {
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name)
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Gerado: ${name} (${size}x${size})`)
    }
    
    console.log('\n✨ Todos os ícones foram gerados com sucesso!')
    console.log('📁 Arquivos salvos em: public/')
    console.log('\n📋 Arquivos gerados:')
    sizes.forEach(({ name }) => {
      console.log(`   - ${name}`)
    })
    console.log('\n🎉 Pronto! Os ícones estão prontos para uso.\n')
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message)
    console.log('\n💡 Tente instalar sharp: npm install sharp --save-dev\n')
    process.exit(1)
  }
}

generateIcons()

