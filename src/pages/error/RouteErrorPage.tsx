import { RouteError } from '@/components/ui/RouteError'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messages } from '@/messages/en'

export function RouteErrorPage() {
  useDocumentTitle(messages.error.documentTitle)

  return <RouteError />
}
