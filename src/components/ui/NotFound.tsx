import { Link } from 'react-router-dom'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { FOCUS_RING } from './focusRing'
import { messages } from '@/messages/en'

interface NotFoundProps {
  subject: 'lesson' | 'page'
}

export function NotFound({ subject }: NotFoundProps) {
  const copy = messages.notFound[subject]

  return (
    <ContentColumn className="py-20 text-center">
      <h1 className="text-xl font-semibold text-text-primary mb-3">{copy.title}</h1>
      <p className="text-text-secondary mb-6">{copy.body}</p>
      <Link
        to="/"
        className={`text-text-muted hover:text-text-primary underline text-sm rounded ${FOCUS_RING}`}
      >
        {messages.notFound.back}
      </Link>
    </ContentColumn>
  )
}
