import { defineConfig } from 'vitest/config'
import lessonMarkdown from './src/lib/lesson-markdown/lessonMarkdownPlugin'

export default defineConfig({
  plugins: [lessonMarkdown()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
