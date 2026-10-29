import { ContentColumn } from '@/components/layout/ContentColumn'
import { SkeletonBar } from '@/components/ui/SkeletonBar'
import { StepSpacer } from './StepSpacer'

export function LessonSkeleton() {
  return (
    <ContentColumn className="flex-1 flex flex-col">
      <StepSpacer grow="flex-2" />
      <div className="shrink-0 space-y-6">
        <div className="text-xl tracking-tight">
          <SkeletonBar className="h-lh w-56" />
        </div>
        <div className="space-y-1 text-sm leading-relaxed">
          <SkeletonBar className="h-lh w-full" />
          <SkeletonBar className="h-lh w-full" />
          <SkeletonBar className="h-lh w-2/3" />
        </div>
        <div className="space-y-1 text-sm leading-relaxed">
          <SkeletonBar className="h-lh w-full" />
          <SkeletonBar className="h-lh w-1/2" />
        </div>
      </div>
      <StepSpacer grow="flex-3" />
    </ContentColumn>
  )
}
