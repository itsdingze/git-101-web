import { AutoScroller, Cursor, Feedback, PreventSelection } from '@dnd-kit/dom'
import { KeyboardSensor, PointerSensor } from '@dnd-kit/react'

export const BLOCK_DRAG_SENSORS = [
  PointerSensor,
  KeyboardSensor.configure({
    keyboardCodes: { ...KeyboardSensor.defaults.keyboardCodes, start: ['Space'] },
  }),
]

export const BLOCK_DRAG_PLUGINS = [AutoScroller, Cursor, Feedback, PreventSelection]
