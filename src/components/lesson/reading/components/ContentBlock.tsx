import { Info, Lightbulb, TriangleAlert, OctagonAlert, type LucideIcon } from 'lucide-react'
import type { ContentBlock as ContentBlockType, CalloutVariant } from '@/types'
import { CodeBlock } from './CodeBlock'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { TabsBlock } from '@/components/lesson/reading/tabs/TabsBlock'
import type { EditorGroup } from '@/components/lesson/reading/model/editorGroups'
import { CodeEditor } from '@/components/lesson/editor/CodeEditor'
import { FinderWindow } from '@/components/lesson/reading/finder/FinderWindow'
import { ShellCodeText } from './ShellCodeText'
import { TerminalExample } from '@/components/lesson/reading/terminal-example/TerminalExample'
import { messages } from '@/messages/en'

const CALLOUT_STYLES: Record<CalloutVariant, { icon: LucideIcon; shell: string; accent: string }> = {
  info: { icon: Info, shell: 'bg-accent-blue/5 border-accent-blue/20', accent: 'text-accent-blue-strong' },
  tip: { icon: Lightbulb, shell: 'bg-accent-green/5 border-accent-green/20', accent: 'text-accent-green-strong' },
  warning: { icon: TriangleAlert, shell: 'bg-accent-orange/5 border-accent-orange/25', accent: 'text-accent-orange-strong' },
  danger: { icon: OctagonAlert, shell: 'bg-accent-red/5 border-accent-red/25', accent: 'text-accent-red-strong' },
}

interface ContentBlockProps {
  block: ContentBlockType | EditorGroup
}

export function ContentBlock({ block }: ContentBlockProps) {
  switch (block.type) {
    case 'text':
      return <InlineMarkdown as="div" className="text-sm text-text-secondary leading-relaxed" value={block.value} />

    case 'code':
      return (
        <CodeBlock label={messages.reading.codeSample}className="bg-code-bg rounded-xl px-5 py-4 font-mono text-xs leading-relaxed">
          {block.language === 'bash' ? (
            <ShellCodeText value={block.value} />
          ) : (
            <code className="text-code-text">{block.value}</code>
          )}
        </CodeBlock>
      )

    case 'diff':
      return <CodeEditor files={[block]} />

    case 'editor':
      return <CodeEditor files={block.files} />

    case 'terminal':
      return <TerminalExample block={block} />

    case 'files':
      return <FinderWindow block={block} />

    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List
          className={`space-y-2 pl-5 text-sm text-text-secondary leading-relaxed marker:text-text-muted ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {block.items.map((item) => (
            <InlineMarkdown key={item} as="li" className="pl-1" value={item} />
          ))}
        </List>
      )
    }

    case 'callout': {
      const { icon: Icon, shell, accent } = CALLOUT_STYLES[block.variant]
      return (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${shell}`}>
          <Icon size={18} className={`shrink-0 mt-0.5 ${accent}`} aria-hidden />
          <div className="space-y-1">
            {block.title && <InlineMarkdown className={`text-sm font-semibold ${accent}`} value={block.title} />}
            <InlineMarkdown as="div" className="text-sm text-text-secondary leading-relaxed" value={block.value} />
          </div>
        </div>
      )
    }

    case 'tabs':
      return <TabsBlock block={block} />

    default: {
      const _exhaustive: never = block
      return _exhaustive
    }
  }
}
