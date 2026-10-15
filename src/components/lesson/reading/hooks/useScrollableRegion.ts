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

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
}

export function useScrollableRegion<T extends HTMLElement>(
  label: string,
  contentKey?: unknown,
): ScrollableRegion<T> {
  const ref = useRef<T>(null)
  const [scrollable, setScrollable] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setScrollable(overflows(el))
  }, [contentKey])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cancelled = false
    const measure = () => {
      if (!cancelled) setScrollable(overflows(el))
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
