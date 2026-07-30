const LINK = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
const CODE = /`([^`\n]+)`/g
const BOLD = /\*\*([^*\n]+)\*\*/g
const ITALIC = /(^|[^*])\*([^*\n]+)\*/g
const PARKED = /@@PARK(\d+)@@/g

const LINK_CLASS =
  'text-accent-blue hover:underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue'
const CODE_CLASS = 'bg-bg-card px-1.5 py-0.5 rounded text-text-primary font-mono text-xs'

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
    .replace(CODE, (_, code: string) => park(`<code class="${CODE_CLASS}">${code}</code>`))
    .replace(BOLD, '<strong class="text-text-primary font-medium">$1</strong>')
    .replace(ITALIC, '$1<em class="italic">$2</em>')
    .replace(/\n/g, '<br />')
    .replace(PARKED, (_, index: string) => parked[Number(index)] ?? '')
}
