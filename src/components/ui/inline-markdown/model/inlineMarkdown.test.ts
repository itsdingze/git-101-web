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


describe('inlineMarkdown links and emphasis', () => {
  it('keeps one pair of parentheses inside a link address', () => {
    const link = rendered(inlineMarkdown('[wiki](https://en.wikipedia.org/wiki/Git_(software))')).querySelector('a')

    expect(link?.getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Git_(software)')
    expect(link?.textContent).toBe('wiki')
  })

  it('leaves a link alone when a code chip would sit in its address', () => {
    const container = rendered(inlineMarkdown('[x](https://a`b`c)'))

    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('code')?.textContent).toBe('b')
    expect(container.textContent).toBe('[x](https://abc)')
  })

  it('renders bold link text as bold', () => {
    const link = rendered(inlineMarkdown('[**bold**](https://a)')).querySelector('a')

    expect(link?.querySelector('strong')?.textContent).toBe('bold')
    expect(link?.textContent).toBe('bold')
  })

  it('renders italic link text as italic', () => {
    const link = rendered(inlineMarkdown('[*slanted*](https://a)')).querySelector('a')

    expect(link?.querySelector('em')?.textContent).toBe('slanted')
  })

  it('keeps asterisks used as multiplication signs', () => {
    const container = rendered(inlineMarkdown('2 * 3 * 4'))

    expect(container.textContent).toBe('2 * 3 * 4')
    expect(container.querySelector('em')).toBeNull()
  })

  it('keeps spaced double asterisks as text', () => {
    const container = rendered(inlineMarkdown('2 ** 3 ** 4'))

    expect(container.textContent).toBe('2 ** 3 ** 4')
    expect(container.querySelector('strong')).toBeNull()
  })

  it('still renders bold and italic phrases', () => {
    const container = rendered(inlineMarkdown('**two words** and *two more*'))

    expect(container.querySelector('strong')?.textContent).toBe('two words')
    expect(container.querySelector('em')?.textContent).toBe('two more')
  })
})

const HOSTILE_INPUT = [
  '[x](javascript:alert(1))',
  '[x](JAVASCRIPT:alert(1))',
  '[x](&#106;avascript:alert(1))',
  '[x](data:text/html,<script>alert(1)</script>)',
  '[x](//evil.example)',
  '[x](https://a"onmouseover="alert(1))',
  "[x](https://a'onmouseover='alert(1))",
  '[x](https://a`b`c)',
  `[x](https://a\`${'word '.repeat(8)}\`c)`,
  '[x](https://a`"><img src=x onerror=alert(1)>`c)',
  '[<img src=x onerror=alert(1)>](https://a)',
  '**<script>alert(1)</script>**',
  '<a href="javascript:alert(1)">x</a>',
  'see @@PARK0@@ and `code`',
  '&#64;&#64;PARK0&#64;&#64; `code`',
  '[x](/downloads/../../a.zip)',
  '[x](/downloads/a.zip"onclick="x)',
  '[x](https://a"b(c"d)e)',
  '[x](https://a(<img src=x onerror=alert(1)>))',
  '[**<img src=x onerror=alert(1)>**](https://a)',
  '[x](https://user@evil.example)',
]

describe('inlineMarkdown with hostile input', () => {
  it.each(HOSTILE_INPUT)('renders %s without scripts, handlers or broken links', (input) => {
    const container = rendered(inlineMarkdown(input))

    for (const element of container.querySelectorAll('*')) {
      expect(['A', 'CODE', 'SPAN', 'STRONG', 'EM', 'BR']).toContain(element.tagName)
      expect(element.getAttributeNames().filter((name) => name.startsWith('on'))).toEqual([])
    }
    for (const link of container.querySelectorAll('a')) {
      expect(link.getAttributeNames().sort()).toEqual(['class', 'href', 'rel', 'target'])
      expect(link.getAttribute('href')).toMatch(/^https?:\/\//)
    }
  })
})

describe('inlineMarkdown escaping', () => {
  it('keeps a quote in a link address inside the href attribute', () => {
    const link = rendered(inlineMarkdown('[x](https://a"onmouseover="alert(1))')).querySelector('a')

    expect(link?.getAttributeNames().sort()).toEqual(['class', 'href', 'rel', 'target'])
    expect(link?.getAttribute('href')).toBe('https://a"onmouseover="alert(1)')
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
