import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { App } from './App'
import { RouteErrorPage } from './pages/error/RouteErrorPage'
import { NotFoundPage } from './pages/not-found/NotFoundPage'

const HomePage = lazy(() => import('./pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const LessonPage = lazy(() => import('./pages/lesson/LessonPage').then((m) => ({ default: m.LessonPage })))
const SummaryPage = lazy(() => import('./pages/summary/SummaryPage').then((m) => ({ default: m.SummaryPage })))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lesson/:lessonId', element: <LessonPage /> },
      { path: 'lesson/:lessonId/summary', element: <SummaryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
