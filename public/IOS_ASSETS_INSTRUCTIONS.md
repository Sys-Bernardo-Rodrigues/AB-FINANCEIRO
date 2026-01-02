# Instruções para Criar Assets iOS

## Ícones Apple Touch Icon Necessários

Para uma experiência completa no iPhone/iPad, você precisa criar os seguintes ícones:

### Tamanhos Necessários:
- apple-icon-57x57.png (iPhone 3G/3GS)
- apple-icon-60x60.png (iPhone 4/4S)
- apple-icon-72x72.png (iPad)
- apple-icon-76x76.png (iPad)
- apple-icon-114x114.png (iPhone 4/4S Retina)
- apple-icon-120x120.png (iPhone 5/5S/5C/SE)
- apple-icon-144x144.png (iPad Retina)
- apple-icon-152x152.png (iPad Retina)
- apple-icon-180x180.png (iPhone 6/6 Plus e superiores) ⭐ **ESSENCIAL**

### Como Criar:

#### Opção 1: PWA Asset Generator (Recomendado)
1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload de uma imagem (mínimo 512x512)
3. Marque a opção "Generate iOS icons"
4. Baixe todos os ícones gerados
5. Coloque na pasta public/

#### Opção 2: Ferramentas Online
- https://realfavicongenerator.net/ (gera todos os tamanhos automaticamente)
- https://www.favicon-generator.org/
- https://www.appicon.co/ (especializado em ícones iOS)

#### Opção 3: Ferramentas de Design
1. Crie um ícone quadrado (512x512 ou maior)
2. Use cores do tema: #6366f1 (primary)
3. Exporte em PNG com fundo sólido (não transparente para iOS)
4. Redimensione para cada tamanho necessário
5. Coloque na pasta public/

### Mínimo Necessário:
Se você criar apenas um ícone, crie o **apple-icon-180x180.png** que é o mais importante para iPhones modernos.

## Splash Screens (Opcional)

Splash screens são as telas de carregamento que aparecem ao abrir o app. São opcionais mas melhoram a experiência.

### Tamanhos de Splash Screen:
- splash-iphone-se.png (320x568) - iPhone SE
- splash-iphone-8.png (375x667) - iPhone 8
- splash-iphone-x.png (375x812) - iPhone X/XS
- splash-iphone-12.png (390x844) - iPhone 12/13
- splash-iphone-11.png (414x896) - iPhone 11
- splash-iphone-11-pro-max.png (414x896) - iPhone 11 Pro Max
- splash-iphone-13-pro-max.png (428x926) - iPhone 13 Pro Max

### Como Criar Splash Screens:
1. Use uma ferramenta como: https://appsco.pe/developer/splash-screens
2. Ou crie manualmente com o logo centralizado
3. Use a cor de fundo: #f0f4ff (background_color do manifest)

## Notas Importantes

- **Ícones iOS**: Devem ter fundo sólido (não transparente)
- **Tamanho mínimo**: 180x180 para iPhones modernos
- **Formato**: PNG
- **Qualidade**: Alta resolução (retina)
- **Cores**: Use cores vibrantes que se destaquem

## Testando no iPhone

1. Acesse o site no Safari do iPhone
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Verifique se o ícone aparece corretamente
5. Abra o app e verifique se abre em tela cheia

## Fallback

Se você não criar todos os ícones, o sistema usará:
- icon-192.png como fallback para todos os tamanhos
- icon-512.png como fallback alternativo

Mas é recomendado criar pelo menos o apple-icon-180x180.png para melhor experiência.
