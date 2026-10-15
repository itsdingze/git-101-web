import { codeTokens, type CodeTokenKind } from '@/components/lesson/editor/model/codeTokens'

const TOKEN_STYLES: Record<CodeTokenKind, string> = {
  plain: '',
  function: 'text-editor-function',
  string: 'text-editor-string',
  number: 'text-editor-number',
  operator: 'text-editor-operator',
  'conflict-marker': '',
}

export function CodeText({ text }: { text: string }) {
  if (!text) return ' '
  let start = 0
  return codeTokens(text).map((token) => {
    const key = start
    start += token.text.length
    return (
      <span key={key} className={TOKEN_STYLES[token.kind]}>
        {token.text}
      </span>
    )
  })
}
