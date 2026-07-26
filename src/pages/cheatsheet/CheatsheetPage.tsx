import useProgressStore from '@/stores/progressStore'
import cheatsheet from '@/data/cheatsheet'
import CheatsheetCategory from './components/CheatsheetCategory'

export default function CheatsheetPage() {
  const completedLessons = useProgressStore((s) => s.completedLessons)

  return (
    <div className="w-full max-w-2xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight leading-tight">
          Cheat Sheet
        </h1>
        <p className="text-base text-text-muted mt-2 leading-relaxed">
          Quick reference for Git commands
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {cheatsheet.map((category) => (
          <CheatsheetCategory
            key={category.name}
            name={category.name}
            commands={category.commands}
            completedLessons={completedLessons}
          />
        ))}
      </div>
    </div>
  )
}
