import CodeBlock from '@/components/ui/CodeBlock'

interface ResolvedFileProps {
  fileName: string
  content: string
}

export default function ResolvedFile({ fileName, content }: ResolvedFileProps) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-2">
        Resolved <span className="font-mono">{fileName}</span>
      </div>
      <CodeBlock
        label={`${fileName} after resolving`}
        className="bg-code-bg rounded-xl border border-accent-green/30 px-5 py-4 font-mono text-xs leading-relaxed text-code-text"
      >
        {content}
      </CodeBlock>
    </div>
  )
}
