export const SITE_URL = 'https://itsdingze.github.io/git-101-web/'

export function lessonPath(id: number): string {
  return `lesson/${id}/`
}

export function shareImagePath(page: 'home' | number): string {
  return page === 'home' ? 'og/home.png' : `og/lesson-${page}.png`
}
