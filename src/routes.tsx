import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { App } from './App'
import { RouteErrorPage } from './pages/error/RouteErrorPage'
import { NotFoundPage } from './pages/not-found/NotFoundPage'
import { HomeSkeleton } from './pages/home/components/HomeSkeleton'
import { LessonSkeleton } from './pages/lesson/components/LessonSkeleton'
import { SummarySkeleton } from './pages/summary/components/SummarySkeleton'

const HomePage = lazy(() => import('./pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const LessonPage = lazy(() => import('./pages/lesson/LessonPage').then((m) => ({ default: m.LessonPage })))
const SummaryPage = lazy(() => import('./pages/summary/SummaryPage').then((m) => ({ default: m.SummaryPage })))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<HomeSkeleton />}><HomePage /></Suspense> },
      { path: 'lesson/:lessonId', element: <Suspense fallback={<LessonSkeleton />}><LessonPage /></Suspense> },
      { path: 'lesson/:lessonId/summary', element: <Suspense fallback={<SummarySkeleton />}><SummaryPage /></Suspense> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
