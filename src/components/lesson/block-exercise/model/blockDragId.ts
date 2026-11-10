import type { UniqueIdentifier } from '@dnd-kit/abstract'

const GLOSSARY_PREFIX = 'avail-'

export function glossaryDragId(block: string): string {
  return `${GLOSSARY_PREFIX}${block}`
}

export function isFromGlossary(id: UniqueIdentifier | null | undefined): boolean {
  return String(id ?? '').startsWith(GLOSSARY_PREFIX)
}

export function blockOf(id: UniqueIdentifier): string {
  const text = String(id)
  return text.startsWith(GLOSSARY_PREFIX) ? text.slice(GLOSSARY_PREFIX.length) : text
}
