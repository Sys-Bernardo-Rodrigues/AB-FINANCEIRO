// Script para gerar ícones do AB Financeiro
// Este script cria um SVG e fornece instruções para converter em PNG

const fs = require('fs')
const path = require('path')

console.log('🎨 Gerando ícone personalizado para AB Financeiro...\n')

// SVG otimizado para o ícone AB Financeiro
const iconSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fundo arredondado -->
  <rect width="512" height="512" rx="120" fill="url(#bgGradient)"/>
  
  <!-- Letra A -->
  <path d="M 140 380 L 140 200 L 200 200 L 256 320 L 312 200 L 372 200 L 372 380 L 312 380 L 312 280 L 256 400 L 200 400 L 200 280 L 200 380 Z" 
        fill="white" 
        stroke="none"/>
  
  <!-- Letra B -->
  <path d="M 200 200 L 200 380 L 280 380 Q 330 380 330 330 Q 330 290 300 290 L 280 290 L 280 200 Z M 280 290 Q 310 290 310 330 Q 310 370 280 370 L 220 370 L 220 210 L 280 210 Q 310 210 310 250 Q 310 290 280 290 Z" 
        fill="white" 
        stroke="none"/>
</svg>`

const publicDir = path.join(__dirname, '..', 'public')

// Salvar SVG
fs.writeFileSync(path.join(publicDir, 'icon-ab.svg'), iconSVG)
console.log('✅ SVG criado: public/icon-ab.svg\n')

// Instruções para conversão
const instructions = `# Instruções para Gerar Ícones PNG do AB Financeiro

## Arquivo Base
O arquivo \`icon-ab.svg\` foi criado na pasta \`public/\`.

## Tamanhos Necessários:
- icon-192.png (192x192 pixels)
- icon-512.png (512x512 pixels)
- apple-icon-180x180.png (180x180 pixels)

## Como Converter SVG para PNG:

### Opção 1: Online (Mais Fácil)
1. Acesse: https://cloudconvert.com/svg-to-png
2. Faça upload do arquivo \`public/icon-ab.svg\`
3. Configure o tamanho (192x192, 512x512, etc.)
4. Baixe e renomeie conforme necessário
5. Coloque os arquivos na pasta \`public/\`

### Opção 2: Usando Inkscape (Gratuito)
\`\`\`bash
# Instalar Inkscape (se não tiver)
# Windows: https://inkscape.org/release/
# Mac: brew install inkscape
# Linux: sudo apt install inkscape

# Converter para PNG
inkscape public/icon-ab.svg --export-filename=public/icon-192.png --export-width=192 --export-height=192
inkscape public/icon-ab.svg --export-filename=public/icon-512.png --export-width=512 --export-height=512
inkscape public/icon-ab.svg --export-filename=public/apple-icon-180x180.png --export-width=180 --export-height=180
\`\`\`

### Opção 3: Usando ImageMagick
\`\`\`bash
# Instalar ImageMagick
# Windows: https://imagemagick.org/script/download.php
# Mac: brew install imagemagick
# Linux: sudo apt install imagemagick

# Converter para PNG
convert -background none -resize 192x192 public/icon-ab.svg public/icon-192.png
convert -background none -resize 512x512 public/icon-ab.svg public/icon-512.png
convert -background none -resize 180x180 public/icon-ab.svg public/apple-icon-180x180.png
\`\`\`

### Opção 4: Usando Node.js (sharp)
\`\`\`bash
npm install sharp --save-dev
\`\`\`

Depois execute:
\`\`\`javascript
const sharp = require('sharp')
const fs = require('fs')

sharp('public/icon-ab.svg')
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png')

sharp('public/icon-ab.svg')
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png')

sharp('public/icon-ab.svg')
  .resize(180, 180)
  .png()
  .toFile('public/apple-icon-180x180.png')
\`\`\`

## Verificação
Após gerar os ícones, verifique se os arquivos estão na pasta \`public/\`:
- icon-192.png
- icon-512.png
- apple-icon-180x180.png

## Teste
Abra o aplicativo no navegador e verifique se o ícone aparece corretamente na aba e quando instalado como PWA.
`

fs.writeFileSync(
  path.join(publicDir, 'ICON_GENERATION_INSTRUCTIONS.md'),
  instructions
)

console.log('📋 Instruções salvas em: public/ICON_GENERATION_INSTRUCTIONS.md')
console.log('\n✨ Próximos passos:')
console.log('   1. Siga as instruções para converter o SVG em PNG')
console.log('   2. Coloque os arquivos PNG na pasta public/')
console.log('   3. Teste o aplicativo para verificar se os ícones aparecem corretamente\n')


