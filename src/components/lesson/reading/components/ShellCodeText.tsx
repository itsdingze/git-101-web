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

export default function ShellCodeText({ value }: ShellCodeTextProps) {
  const lines = keyedLines(value)

  return (
    <code className="text-code-text">
      {lines.map(({ key, code, comment }, position) => (
        <span key={key}>
          {code}
          {comment && <span className="select-none text-code-muted">{comment}</span>}
          {position < lines.length - 1 && '\n'}
        </span>
      ))}
    </code>
  )
}
