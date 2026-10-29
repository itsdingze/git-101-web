import { ContentColumn } from '@/components/layout/ContentColumn'
import { SkeletonBar } from '@/components/ui/SkeletonBar'

const VISIBLE_LESSON_ROWS = 6

function LessonCardSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-transparent">
      <SkeletonBar className="shrink-0 size-10 rounded-full" />
      <div className="flex flex-1 min-w-0 flex-col gap-1">
        <div className="flex flex-col gap-0.5">
          <div className="text-sm leading-snug">
            <SkeletonBar className="h-lh w-40" />
          </div>
          <div className="text-xs leading-relaxed">
            <SkeletonBar className="h-lh w-80" />
          </div>
        </div>
        <div className="text-xs">
          <SkeletonBar className="h-lh w-20" />
        </div>
      </div>
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <ContentColumn className="flex flex-col gap-10 py-12 sm:py-16">
      <div className="flex flex-col items-start gap-6">
        <div className="text-3xl sm:text-4xl leading-tight">
          <SkeletonBar className="h-lh w-64" />
        </div>
        <SkeletonBar className="h-11 w-38 rounded-lg" />
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: VISIBLE_LESSON_ROWS }, (_, row) => (
          <LessonCardSkeleton key={row} />
        ))}
      </div>
    </ContentColumn>
  )
}
