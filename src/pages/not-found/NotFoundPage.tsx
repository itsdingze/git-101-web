import { NotFound } from '@/components/ui/NotFound'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messages } from '@/messages/en'

export function NotFoundPage() {
  useDocumentTitle(messages.app.pageNotFoundTitle)

  return <NotFound subject="page" />
}
