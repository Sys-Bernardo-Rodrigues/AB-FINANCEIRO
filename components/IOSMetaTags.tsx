'use client'

import { useEffect } from 'react'

export default function IOSMetaTags() {
  useEffect(() => {
    // Adicionar meta tags dinamicamente para iOS
    const addMetaTag = (name: string, content: string, isProperty = false) => {
      const existing = document.querySelector(
        isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
      )
      if (!existing) {
        const meta = document.createElement('meta')
        if (isProperty) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        meta.setAttribute('content', content)
        document.head.appendChild(meta)
      }
    }

    // Adicionar link tags para ícones Apple
    const addLinkTag = (rel: string, href: string, sizes?: string) => {
      const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`)
      if (!existing) {
        const link = document.createElement('link')
        link.setAttribute('rel', rel)
        link.setAttribute('href', href)
        if (sizes) {
          link.setAttribute('sizes', sizes)
        }
        document.head.appendChild(link)
      }
    }

    // Meta tags para iOS
    addMetaTag('apple-mobile-web-app-capable', 'yes')
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default')
    addMetaTag('apple-mobile-web-app-title', 'AB Financeiro')
    addMetaTag('mobile-web-app-capable', 'yes')

    // Ícones Apple Touch Icon
    addLinkTag('apple-touch-icon', '/apple-icon-180x180.png', '180x180')
    
    // Ícones específicos para diferentes dispositivos (se existirem)
    const appleIcons = [
      { sizes: '57x57', href: '/apple-icon-57x57.png' },
      { sizes: '60x60', href: '/apple-icon-60x60.png' },
      { sizes: '72x72', href: '/apple-icon-72x72.png' },
      { sizes: '76x76', href: '/apple-icon-76x76.png' },
      { sizes: '114x114', href: '/apple-icon-114x114.png' },
      { sizes: '120x120', href: '/apple-icon-120x120.png' },
      { sizes: '144x144', href: '/apple-icon-144x144.png' },
      { sizes: '152x152', href: '/apple-icon-152x152.png' },
      { sizes: '180x180', href: '/apple-icon-180x180.png' },
    ]

    appleIcons.forEach(({ sizes, href }) => {
      addLinkTag('apple-touch-icon', href, sizes)
    })
  }, [])

  return null
}

