const LANGUAGES: Record<string, string> = {
  md: 'Markdown',
  gitignore: 'Ignore',
  log: 'Log',
  py: 'Python',
}

export function editorLanguage(fileName: string): string {
  const extension = fileName.includes('.') ? (fileName.split('.').pop() ?? '') : ''
  return LANGUAGES[extension] ?? 'Plain Text'
}
