import { FOCUS_RING_INSET } from '@/components/ui/focusRing'
import type { FolderLocation } from '@/lib/file-tree/fileTree'
import { pathBarCrumbs, type PathCrumb } from '@/components/lesson/reading/finder/model/pathBarCrumbs'
import { TruncatedPath } from '@/components/lesson/components/TruncatedPath'
import { DiskIcon, FolderIcon } from './FinderIcon'

const CRUMB_ICON = 'mr-1 inline-block h-2.5 w-3 align-[-1px]'
const DISK_ICON = 'mx-1 inline-block h-3.5 w-3 align-[-3px]'
const CRUMB_BUTTON = `cursor-pointer rounded px-0.5 hover:bg-finder-control-hover active:bg-finder-control-active ${FOCUS_RING_INSET}`

function CrumbLabel({ crumb }: { crumb: PathCrumb }) {
  if (crumb.kind === 'disk') {
    return (
      <>
        <DiskIcon className={DISK_ICON} />
        <span className="sr-only">{crumb.name}</span>
      </>
    )
  }
  return (
    <>
      <FolderIcon className={CRUMB_ICON} />
      {crumb.name}
    </>
  )
}

interface FinderPathBarProps {
  location: FolderLocation
  onOpen: (location: FolderLocation) => void
}

export function FinderPathBar({ location, onOpen }: FinderPathBarProps) {
  const crumbs = pathBarCrumbs(location)
  const currentIndex = crumbs.length - 1

  return (
    <TruncatedPath className="h-6 shrink-0 border-t border-border bg-bg-secondary px-3 font-sans text-2xs leading-6 text-text-secondary">
      {crumbs.map((crumb, index) => {
        const isCurrent = index === currentIndex
        return (
          <li key={crumb.key} className="inline">
            {index > 0 && (
              <span aria-hidden className="px-0.5 text-text-muted">
                ›
              </span>
            )}
            <button
              type="button"
              aria-current={isCurrent ? 'location' : undefined}
              onClick={() => onOpen(crumb.location)}
              className={`${CRUMB_BUTTON} ${isCurrent ? 'font-medium text-text-primary' : ''}`}
            >
              <CrumbLabel crumb={crumb} />
            </button>
          </li>
        )
      })}
    </TruncatedPath>
  )
}
