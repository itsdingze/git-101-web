interface CommandsListProps {
  commands: string[]
}

export default function CommandsList({ commands }: CommandsListProps) {
  if (commands.length === 0) return null

  return (
    <div className="border border-border rounded-xl p-6 mt-12">
      <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
        Commands You Learned
      </h2>
      <div className="flex flex-wrap gap-2">
        {commands.map((cmd) => (
          <code
            key={cmd}
            className="min-w-0 break-words bg-bg-card text-text-primary px-3 py-1.5 rounded-lg text-sm font-mono"
          >
            {cmd}
          </code>
        ))}
      </div>
    </div>
  )
}
