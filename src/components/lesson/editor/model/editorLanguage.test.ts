import { describe, expect, it } from 'vitest'
import { editorLanguage } from './editorLanguage'

describe('editor language', () => {
  it.each([
    ['README.md', 'Markdown'],
    ['.gitignore', 'Ignore'],
    ['debug.log', 'Log'],
    ['app.py', 'Python'],
    ['app.txt', 'Plain Text'],
    ['Makefile', 'Plain Text'],
  ])('name %s as %s', (fileName, language) => {
    expect(editorLanguage(fileName)).toBe(language)
  })
})
