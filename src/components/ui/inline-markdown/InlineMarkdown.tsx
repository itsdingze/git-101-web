import type { ElementType } from 'react'
import { inlineMarkdown } from '@/components/ui/inline-markdown/model/inlineMarkdown'

interface InlineMarkdownProps {
  value: string
  id?: string
  className?: string
  as?: ElementType
}

export function InlineMarkdown({ value, id, className, as: Tag = 'p' }: InlineMarkdownProps) {
  return (
    <Tag
      id={id}
      className={className}
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- SAFE: inlineMarkdown escapes every & < > " ' in the input, including learner input echoed in coach tips, before adding its own tags, and links accept only http(s) or /downloads/*.zip addresses
      dangerouslySetInnerHTML={{ __html: inlineMarkdown(value) }}
    />
  )
}
