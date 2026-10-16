import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { routes } from './routes'
import { watchSystemTheme } from './stores/themeStore'

watchSystemTheme()

const router = createBrowserRouter(routes, { basename: '/git-101-web' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
