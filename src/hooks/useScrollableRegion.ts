import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ScrollableRegionProps {
  tabIndex?: 0
  role?: 'region'
  'aria-label'?: string
}

interface ScrollableRegion<T extends HTMLElement> {
  ref: RefObject<T | null>
  regionProps: ScrollableRegionProps
}

export default function useScrollableRegion<T extends HTMLElement>(
  label: string,
  contentKey?: unknown,
): ScrollableRegion<T> {
  const ref = useRef<T>(null)
  const [scrollable, setScrollable] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setScrollable(el.scrollWidth > el.clientWidth)
  }, [contentKey])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cancelled = false
    const measure = () => {
      if (!cancelled) setScrollable(el.scrollWidth > el.clientWidth)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    void document.fonts.ready.then(measure)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [])

  return {
    ref,
    regionProps: scrollable ? { tabIndex: 0, role: 'region', 'aria-label': label } : {},
  }
}
