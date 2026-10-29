import { LINK_CLASS } from '@/components/ui/linkClass'

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/downloads\/[a-zA-Z0-9_-]+\.zip)\)/g
const CODE = /`([^`\n]+)`/g
const BOLD = /\*\*([^*\n]+)\*\*/g
const ITALIC = /(^|[^*])\*([^*\n]+)\*/g
const PARKED = /@@PARK(\d+)@@/g

const CODE_CLASS = 'bg-bg-card px-1.5 py-0.5 rounded text-text-primary font-mono text-xs box-decoration-clone'
const CODE_WORD_CLASS = 'inline-block max-w-full wrap-anywhere'
const UNBREAKABLE_CODE_LENGTH = 24

function codeChip(code: string): string {
  if (code.length <= UNBREAKABLE_CODE_LENGTH) return `<code class="${CODE_CLASS} whitespace-nowrap">${code}</code>`

  const words = code.split(' ').map((word) => `<span class="${CODE_WORD_CLASS}">${word}</span>`)
  return `<code class="${CODE_CLASS}">${words.join(' ')}</code>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/@/g, '&#64;')
}

export function inlineMarkdown(value: string): string {
  const parked: string[] = []
  const park = (html: string) => `@@PARK${parked.push(html) - 1}@@`
  const unpark = (html: string): string => html.replace(PARKED, (_, index: string) => unpark(parked[Number(index)] ?? ''))

  const html = escapeHtml(value)
    .replace(CODE, (_, code: string) => park(codeChip(code)))
    .replace(LINK, (_, text: string, href: string) => {
      if (href.startsWith('/downloads/')) {
        const url = `${import.meta.env.BASE_URL}${href.slice(1)}`
        return park(`<a href="${url}" download class="${LINK_CLASS}">${text}</a>`)
      }
      return park(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}">${text}</a>`)
    })
    .replace(BOLD, '<strong class="text-text-primary font-medium">$1</strong>')
    .replace(ITALIC, '$1<em class="italic">$2</em>')
    .replace(/\n/g, '<br />')
  return unpark(html)
}
