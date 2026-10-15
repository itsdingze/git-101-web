import { describe, expect, it } from 'vitest'
import { renderHead } from './renderHead'
import type { PageMeta } from './pageMeta'

const META: PageMeta = {
  title: 'Quotes "and" <tags> & more — Git 101',
  description: 'A <b>bold</b> "claim"',
  canonical: 'https://example.com/lesson/1/',
  image: { url: 'https://example.com/og/lesson-1.png', alt: 'Lesson card' },
  noindex: false,
  jsonLd: { '@type': 'LearningResource', name: '</script><script>alert(1)</script>' },
}

describe('renderHead', () => {
  const head = renderHead(META)

  it('escapes page text inside tags and attributes', () => {
    expect(head).toContain('<title>Quotes &quot;and&quot; &lt;tags&gt; &amp; more — Git 101</title>')
    expect(head).toContain('<meta name="description" content="A &lt;b&gt;bold&lt;/b&gt; &quot;claim&quot;" />')
  })

  it('writes the canonical link and the social card tags', () => {
    expect(head).toContain('<link rel="canonical" href="https://example.com/lesson/1/" />')
    expect(head).toContain('<meta property="og:url" content="https://example.com/lesson/1/" />')
    expect(head).toContain('<meta property="og:image" content="https://example.com/og/lesson-1.png" />')
    expect(head).toContain('<meta property="og:image:width" content="1200" />')
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('cannot be broken out of by text inside the structured data', () => {
    expect(head).toContain('<script type="application/ld+json">')
    expect(head).not.toContain('</script><script>')
    expect(head).toContain('\\u003c/script>')
  })

  it('keeps a page out of search results without a canonical link when asked', () => {
    const hidden = renderHead({ ...META, canonical: null, noindex: true, jsonLd: null })

    expect(hidden).toContain('<meta name="robots" content="noindex" />')
    expect(hidden).not.toContain('rel="canonical"')
    expect(hidden).not.toContain('og:url')
    expect(hidden).not.toContain('application/ld+json')
  })
})
