import { describe, expect, it } from 'vitest'
import { sitemapXml } from './sitemap'

describe('sitemapXml', () => {
  it('lists the home page and every lesson', () => {
    const xml = sitemapXml([{ id: 0 }, { id: 1 }])

    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/)
    expect(xml).toContain('<loc>https://itsdingze.github.io/git-101-web/</loc>')
    expect(xml).toContain('<loc>https://itsdingze.github.io/git-101-web/lesson/0/</loc>')
    expect(xml).toContain('<loc>https://itsdingze.github.io/git-101-web/lesson/1/</loc>')
    expect(xml.match(/<url>/g)).toHaveLength(3)
  })
})
