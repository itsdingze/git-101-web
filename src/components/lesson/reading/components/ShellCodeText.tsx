import { alignShellComments } from '@/lib/text/shellComment'

interface ShellCodeTextProps {
  value: string
}

function keyedLines(value: string): { key: string; code: string; comment: string }[] {
  const seen = new Map<string, number>()
  const lines = value.split('\n')
  return alignShellComments(lines).map((line, index) => {
    const source = lines[index] ?? ''
    const occurrence = seen.get(source) ?? 0
    seen.set(source, occurrence + 1)
    return { key: `${occurrence}:${source}`, ...line }
  })
}

export function ShellCodeText({ value }: ShellCodeTextProps) {
  return (
    <code className="text-code-text">
      {keyedLines(value).map(({ key, code, comment }) => (
        <span key={key} className="block">
          {code === '' && comment === '' ? ' ' : code}
          {comment && <span className="select-none text-code-muted">{comment}</span>}
        </span>
      ))}
    </code>
  )
}
