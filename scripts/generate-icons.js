// Script para gerar ícones placeholder do PWA
// Execute: node scripts/generate-icons.js

const fs = require('fs')
const path = require('path')

// Criar diretório public se não existir
const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

console.log('⚠️  Este script cria ícones placeholder.')
console.log('📝 Para produção, substitua por ícones reais gerados a partir de uma imagem de alta qualidade.')
console.log('🔗 Use ferramentas como: https://www.pwabuilder.com/imageGenerator\n')

// Nota: Este script não pode gerar imagens PNG reais sem bibliotecas adicionais
// Por enquanto, apenas cria um arquivo de instruções

const instructions = `# Instruções para Criar Ícones PWA

## Tamanhos Necessários:
- icon-192.png (192x192 pixels)
- icon-512.png (512x512 pixels)

## Como Criar:

### Opção 1: PWA Asset Generator (Recomendado)
1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload de uma imagem (mínimo 512x512)
3. Baixe os ícones gerados
4. Coloque na pasta public/

### Opção 2: Ferramentas de Design
1. Crie um ícone quadrado (512x512 ou maior)
2. Use cores do tema: #6366f1 (primary)
3. Exporte em PNG com fundo transparente ou colorido
4. Redimensione para 192x192 e 512x512
5. Coloque na pasta public/

### Opção 3: Online Tools
- https://realfavicongenerator.net/
- https://favicon.io/
- https://www.favicon-generator.org/

## Recomendações:
- Use um ícone de carteira ou símbolo financeiro
- Mantenha o design simples e legível
- Teste em diferentes tamanhos
- Considere usar máscara para iOS
`

fs.writeFileSync(
  path.join(publicDir, 'ICON_INSTRUCTIONS.md'),
  instructions
)

console.log('✅ Arquivo de instruções criado em public/ICON_INSTRUCTIONS.md')
console.log('📋 Siga as instruções para criar os ícones necessários')


