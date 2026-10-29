import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { BrandHeaderBar } from '@/components/layout/components/BrandHeaderBar'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { messages } from '@/messages/en'
import { Button } from './Button'

export function RouteError() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="w-full bg-bg-primary border-b border-border">
        <BrandHeaderBar />
      </header>
      <main className="flex-1">
        <ContentColumn className="py-20 flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold text-text-primary">{messages.error.title}</h1>
            <p className="text-text-secondary">{messages.error.body}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button variant="filled" onClick={() => window.location.reload()}>
              <RotateCcw size={14} aria-hidden />
              {messages.error.reload}
            </Button>
            <Button as={Link} variant="outlined" to="/">
              {messages.error.back}
            </Button>
          </div>
        </ContentColumn>
      </main>
    </div>
  )
}
