import { Check, Circle } from 'lucide-react'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import type { SandboxGoal } from '@/types'

interface GoalChecklistProps {
  goals: readonly SandboxGoal[]
  completed: readonly boolean[]
  activeIndex: number
  guided: boolean
}

export default function GoalChecklist({ goals, completed, activeIndex, guided }: GoalChecklistProps) {
  const visible = guided ? goals.slice(0, activeIndex + 1) : goals

  return (
    <ul className="space-y-2">
      {visible.map((goal, index) => {
        const done = completed[index] ?? false
        const active = index === activeIndex && !done

        return (
          <li key={goal.id} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                done ? 'bg-accent-green text-white' : 'text-text-muted'
              }`}
            >
              {done ? <Check size={11} strokeWidth={3} /> : <Circle size={11} strokeWidth={2} />}
            </span>
            <InlineMarkdown
              className={`min-w-0 leading-relaxed transition-colors ${
                done ? 'text-text-muted line-through' : active ? 'text-text-primary' : 'text-text-secondary'
              }`}
              value={goal.label}
            />
          </li>
        )
      })}
    </ul>
  )
}
