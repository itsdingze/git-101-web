import { Check } from 'lucide-react'
import InlineMarkdown from '@/components/ui/InlineMarkdown'

interface SkillsListProps {
  skills: string[]
}

export default function SkillsList({ skills }: SkillsListProps) {
  if (skills.length === 0) return null

  return (
    <div className="border border-border rounded-xl p-6 mt-12">
      <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">You Can Now</h2>
      <ul className="space-y-2.5">
        {skills.map((skill) => (
          <li key={skill} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
            <Check size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
            <InlineMarkdown as="span" value={skill} />
          </li>
        ))}
      </ul>
    </div>
  )
}
