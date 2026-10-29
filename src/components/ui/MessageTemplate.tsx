import { createElement, Fragment, type ReactNode } from 'react'

type SlotName<Template extends string> = Template extends `${string}{${infer Name}}${infer Rest}`
  ? Name | SlotName<Rest>
  : never

interface MessageTemplateProps<Template extends string> {
  template: Template
  slots: Record<SlotName<Template>, ReactNode>
}

const SLOT = /\{(\w+)\}/

export function MessageTemplate<Template extends string>({ template, slots }: MessageTemplateProps<Template>) {
  const filled = new Map<string, ReactNode>(Object.entries(slots))
  const parts = template.split(SLOT).map((part, index) => (index % 2 === 0 ? part : filled.get(part)))

  return createElement(Fragment, null, ...parts)
}
