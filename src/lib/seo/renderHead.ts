import { messages } from '../../messages/en'
import type { PageMeta } from './pageMeta'

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function meta(attribute: 'name' | 'property', key: string, content: string | number): string {
  return `<meta ${attribute}="${key}" content="${escapeHtml(String(content))}" />`
}

function jsonLdScript(data: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

export function renderHead(page: PageMeta): string {
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('name', 'description', page.description),
    page.noindex ? meta('name', 'robots', 'noindex') : null,
    page.canonical ? `<link rel="canonical" href="${escapeHtml(page.canonical)}" />` : null,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', messages.app.name),
    meta('property', 'og:locale', 'en_GB'),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    page.canonical ? meta('property', 'og:url', page.canonical) : null,
    meta('property', 'og:image', page.image.url),
    meta('property', 'og:image:width', SHARE_IMAGE_SIZE.width),
    meta('property', 'og:image:height', SHARE_IMAGE_SIZE.height),
    meta('property', 'og:image:alt', page.image.alt),
    meta('name', 'twitter:card', 'summary_large_image'),
    page.jsonLd ? jsonLdScript(page.jsonLd) : null,
  ]
  return tags.filter((tag) => tag !== null).join('\n    ')
}
