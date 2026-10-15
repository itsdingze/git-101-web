import { useCallback, useEffect, useRef, useState } from 'react'

const SHAKE_MS = 500

interface Shake {
  shaking: boolean
  shake: () => void
  stop: () => void
}

export function useShake(): Shake {
  const [shaking, setShaking] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clear = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
  }, [])

  const stop = useCallback(() => {
    clear()
    setShaking(false)
  }, [clear])

  const shake = useCallback(() => {
    clear()
    setShaking(true)
    timer.current = setTimeout(stop, SHAKE_MS)
  }, [clear, stop])

  useEffect(() => clear, [clear])

  return { shaking, shake, stop }
}
