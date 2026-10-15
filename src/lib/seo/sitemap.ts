import { SITE_URL, lessonPath } from './site'

export function sitemapXml(lessons: readonly { id: number }[]): string {
  const urls = [SITE_URL, ...lessons.map((lesson) => SITE_URL + lessonPath(lesson.id))]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')
}
