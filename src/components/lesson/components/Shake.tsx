import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

const SHAKE = { x: [-4, 4, -4, 4, 0] }
const STILL = {}
const TIMING = { duration: 0.4 }

type ShakeProps = Omit<HTMLMotionProps<'div'>, 'animate' | 'transition'> & {
  shaking: boolean
}

export function Shake({ shaking, ...props }: ShakeProps) {
  const prefersReduced = useReducedMotion()

  return <motion.div animate={shaking && !prefersReduced ? SHAKE : STILL} transition={TIMING} {...props} />
}
