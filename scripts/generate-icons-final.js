// Script para gerar ícones PNG do AB Financeiro a partir do SVG
// Tenta usar sharp se disponível, caso contrário fornece instruções

const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'icon-ab.svg')

console.log('🎨 Gerando ícones PNG do AB Financeiro...\n')

// Verificar se o SVG existe
if (!fs.existsSync(svgPath)) {
  console.error('❌ Arquivo icon-ab.svg não encontrado!')
  console.log('Execute primeiro: node scripts/generate-ab-icons.js\n')
  process.exit(1)
}

// Tentar usar sharp
let sharp
try {
  sharp = require('sharp')
  console.log('✅ Sharp encontrado, gerando PNGs automaticamente...\n')
} catch (e) {
  console.log('⚠️  Sharp não encontrado.')
  console.log('📦 Instalando sharp...\n')
  console.log('Execute: npm install sharp --save-dev\n')
  console.log('Ou siga as instruções em public/ICON_GENERATION_INSTRUCTIONS.md\n')
  process.exit(0)
}

// Tamanhos necessários
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-icon-180x180.png', size: 180 },
]

async function generateIcons() {
  try {
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name)
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
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
    console.log('\n📋 Siga as instruções em public/ICON_GENERATION_INSTRUCTIONS.md\n')
    process.exit(1)
  }
}

generateIcons()



