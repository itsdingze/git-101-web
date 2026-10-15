import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { App } from './App'

const HomePage = lazy(() => import('./pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const LessonPage = lazy(() => import('./pages/lesson/LessonPage').then((m) => ({ default: m.LessonPage })))
const SummaryPage = lazy(() => import('./pages/summary/SummaryPage').then((m) => ({ default: m.SummaryPage })))

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'lesson/:lessonId', element: <LessonPage /> },
        { path: 'lesson/:lessonId/summary', element: <SummaryPage /> },
      ],
    },
  ],
  { basename: '/git-101-web' }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
