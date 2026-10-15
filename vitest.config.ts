import { defineConfig } from 'vitest/config'
import { lessonMarkdown } from './src/lib/lesson-markdown/lessonMarkdownPlugin'

export default defineConfig({
  plugins: [lessonMarkdown()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    // Node 25 ships its own localStorage global, which hides jsdom's.
    execArgv: ['--no-experimental-webstorage'],
    include: ['src/**/*.test.ts'],
  },
})
