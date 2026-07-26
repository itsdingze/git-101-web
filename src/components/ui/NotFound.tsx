import { Link } from 'react-router-dom'

interface NotFoundProps {
  message: string
}

export default function NotFound({ message }: NotFoundProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 sm:px-8 py-20 text-center">
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
    </div>
  )
}
