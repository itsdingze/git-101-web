import { ContentColumn } from '@/components/layout/ContentColumn'
import { SkeletonBar } from '@/components/ui/SkeletonBar'

export function SummarySkeleton() {
  return (
    <ContentColumn className="py-16 sm:py-20 pb-36 sm:pb-40 flex-1 flex flex-col justify-center gap-12">
      <div className="flex flex-col items-center gap-6">
        <SkeletonBar className="size-14 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl">
            <SkeletonBar className="h-lh w-48" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-base leading-relaxed">
              <SkeletonBar className="h-lh w-72" />
            </div>
            <div className="text-sm">
              <SkeletonBar className="h-lh w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <SkeletonBar className="h-11 w-36 rounded-lg" />
        <SkeletonBar className="h-11 w-36 rounded-lg" />
      </div>
    </ContentColumn>
  )
}
