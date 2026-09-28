const LINK = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
const CODE = /`([^`\n]+)`/g
const BOLD = /\*\*([^*\n]+)\*\*/g
const ITALIC = /(^|[^*])\*([^*\n]+)\*/g
const PARKED = /@@PARK(\d+)@@/g

const LINK_CLASS =
  'text-accent-blue hover:underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue'
const CODE_CLASS = 'bg-bg-card px-1.5 py-0.5 rounded text-text-primary font-mono text-xs box-decoration-clone'
const CODE_WORD_CLASS = 'inline-block max-w-full wrap-anywhere'
const UNBREAKABLE_CODE_LENGTH = 24

function codeChip(code: string): string {
  if (code.length <= UNBREAKABLE_CODE_LENGTH) return `<code class="${CODE_CLASS} whitespace-nowrap">${code}</code>`

  const words = code.split(' ').map((word) => `<span class="${CODE_WORD_CLASS}">${word}</span>`)
  return `<code class="${CODE_CLASS}">${words.join(' ')}</code>`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function inlineMarkdown(value: string): string {
  const parked: string[] = []
  const park = (html: string) => `@@PARK${parked.push(html) - 1}@@`

  return escapeHtml(value)
    .replace(LINK, (_, text: string, href: string) =>
      park(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}">${text}</a>`)
    )
    .replace(CODE, (_, code: string) => park(codeChip(code)))
    .replace(BOLD, '<strong class="text-text-primary font-medium">$1</strong>')
    .replace(ITALIC, '$1<em class="italic">$2</em>')
    .replace(/\n/g, '<br />')
    .replace(PARKED, (_, index: string) => parked[Number(index)] ?? '')
}
