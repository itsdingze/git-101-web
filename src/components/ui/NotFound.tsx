import { Link } from 'react-router-dom'
import ContentColumn from '@/components/layout/ContentColumn'

interface NotFoundProps {
  message: string
}

export default function NotFound({ message }: NotFoundProps) {
  return (
    <ContentColumn className="py-20 text-center">
      <h2 className="text-xl font-semibold text-text-primary mb-3">
        We couldn't find that lesson
      </h2>
      <p className="text-text-secondary mb-6">{message}</p>
      <Link
        to="/"
        className="text-text-muted hover:text-text-primary underline text-sm rounded
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        Back to all lessons
      </Link>
    </ContentColumn>
  )
}
