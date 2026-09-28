import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import useDebugStore from '@/stores/debugStore'

export default function useDebugUnlock(): void {
  const [searchParams] = useSearchParams()
  const unlockToggle = useDebugStore((state) => state.unlockToggle)
  const requested = searchParams.has('debug')

  useEffect(() => {
    if (requested) unlockToggle()
  }, [requested, unlockToggle])
}
