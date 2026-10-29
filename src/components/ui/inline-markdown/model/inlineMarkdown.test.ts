// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { inlineMarkdown } from './inlineMarkdown'

function rendered(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

describe('inlineMarkdown code chips', () => {
  it('keeps a short command on one line', () => {
    expect(inlineMarkdown('Use `--staged` here')).toMatch(/<code class="[^"]*whitespace-nowrap[^"]*">--staged<\/code>/)
  })

  it('lets a long command wrap only between its words', () => {
    const html = inlineMarkdown('Run `git config --global user.name "Ada Lovelace"` now')
    const words = [...rendered(html).querySelectorAll('code span')]

    expect(words.map((word) => word.textContent)).toEqual(['git', 'config', '--global', 'user.name', '"Ada', 'Lovelace"'])
    expect(words.every((word) => word.classList.contains('inline-block') && word.classList.contains('wrap-anywhere'))).toBe(true)
    expect(html).toContain('</span> <span')
  })

  it('shows link syntax inside a command as the text that was typed', () => {
    const container = rendered(inlineMarkdown('Type: `git commit -m "see [docs](https://example.com)"`'))

    expect(container.textContent).toBe('Type: git commit -m "see [docs](https://example.com)"')
    expect(container.querySelector('a')).toBeNull()
  })

  it('keeps a command chip inside link text', () => {
    const link = rendered(inlineMarkdown('[`git log`](https://git-scm.com)')).querySelector('a')

    expect(link?.querySelector('code')?.textContent).toBe('git log')
  })

  it('keeps the command text intact for copying', () => {
    const html = inlineMarkdown('Run `git config --global user.name "Ada Lovelace"` now')
    expect(rendered(html).textContent).toBe('Run git config --global user.name "Ada Lovelace" now')
  })
})


describe('inlineMarkdown escaping', () => {
  it('keeps a quote in a link address inside the href attribute', () => {
    const link = rendered(inlineMarkdown('[x](https://a"onmouseover="alert(1))')).querySelector('a')

    expect(link?.getAttributeNames().sort()).toEqual(['class', 'href', 'rel', 'target'])
    expect(link?.getAttribute('href')).toBe('https://a"onmouseover="alert(1')
  })

  it("shows quotes and apostrophes as text, not markup", () => {
    const container = rendered(inlineMarkdown(`It's "fine" <b>`))

    expect(container.textContent).toBe(`It's "fine" <b>`)
    expect(container.children).toHaveLength(0)
  })

  it('shows typed text that looks like an internal placeholder as itself', () => {
    const container = rendered(inlineMarkdown("There's no branch called `@@PARK0@@` yet. See @@PARK0@@"))

    expect(container.textContent).toBe("There's no branch called @@PARK0@@ yet. See @@PARK0@@")
    expect(container.querySelectorAll('code')).toHaveLength(1)
  })
})

describe('inlineMarkdown downloads', () => {
  it('renders a course archive as a download under the deployment base', () => {
    const html = inlineMarkdown('[Download todo-app.zip](/downloads/todo-app.zip)')

    expect(html).toContain('href="'+import.meta.env.BASE_URL+'downloads/todo-app.zip"')
    expect(html).toContain(' download')
    expect(html).not.toContain('target="_blank"')
    expect(html).toContain('Download todo-app.zip</a>')
  })
})
