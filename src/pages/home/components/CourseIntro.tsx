import { messages } from '@/messages/en'
import type { Lesson } from '@/types'
import { CourseCallToAction } from './CourseCallToAction'

interface CourseIntroProps {
  nextLesson: Lesson | undefined
  hasStarted: boolean
}

export function CourseIntro({ nextLesson, hasStarted }: CourseIntroProps) {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight leading-tight">
          {messages.home.hero.title}
        </h1>
      </div>
      <CourseCallToAction nextLesson={nextLesson} hasStarted={hasStarted} />
    </div>
  )
}
