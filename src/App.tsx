import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { LessonFooter } from './components/layout/LessonFooter'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { messages } from '@/messages/en'

export function App() {
  return (
    <LessonNavProvider>
      <div className="flex flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
            focus:px-4 focus:py-2 focus:rounded-lg focus:bg-text-primary focus:text-bg-primary focus:text-sm focus:font-medium focus:no-underline"
        >
          {messages.app.skipToContent}
        </a>
        <Header />
        <main id="main-content" className="flex-1 w-full flex flex-col">
          <Outlet />
        </main>
        <LessonFooter />
      </div>
      <ScrollRestoration />
    </LessonNavProvider>
  )
}
