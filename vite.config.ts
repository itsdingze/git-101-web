import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lessonMarkdown } from './src/lib/lesson-markdown/lessonMarkdownPlugin'
import { sitePages } from './src/lib/seo/sitePagesPlugin'

export default defineConfig({
  base: '/git-101-web/',
  plugins: [lessonMarkdown(), react(), tailwindcss(), sitePages()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
