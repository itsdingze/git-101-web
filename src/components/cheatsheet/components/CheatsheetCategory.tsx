import type { CheatsheetCommand as Command } from '@/data/cheatsheet'
import { CheatsheetCommand } from './CheatsheetCommand'

interface CheatsheetCategoryProps {
  name: string
  commands: Command[]
  completedLessons: number[]
}

export function CheatsheetCategory({ name, commands, completedLessons }: CheatsheetCategoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-text-muted">
        {name}
      </h3>
      <div className="flex flex-col gap-1">
        {commands.map((cmd) => (
          <CheatsheetCommand
            key={cmd.command}
            command={cmd.command}
            description={cmd.description}
            learned={completedLessons.includes(cmd.lessonId)}
            danger={cmd.danger}
          />
        ))}
      </div>
    </section>
  )
}
