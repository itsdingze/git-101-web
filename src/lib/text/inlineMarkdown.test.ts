import { describe, expect, it } from 'vitest'
import inlineMarkdown from './inlineMarkdown'

describe('inlineMarkdown code chips', () => {
  it('keeps a short command on one line', () => {
    expect(inlineMarkdown('Use `--staged` here')).toMatch(/<code class="[^"]*whitespace-nowrap[^"]*">--staged<\/code>/)
  })

  it('lets a long command wrap only between its words', () => {
    const html = inlineMarkdown('Run `git config --global user.name "Ada Lovelace"` now')
    const words = [...html.matchAll(/<span class="([^"]*)">([^<]*)<\/span>/g)]

    expect(words.map((match) => match[2])).toEqual(['git', 'config', '--global', 'user.name', '"Ada', 'Lovelace"'])
    expect(words.every((match) => /inline-block/.test(match[1] ?? '') && /wrap-anywhere/.test(match[1] ?? ''))).toBe(true)
    expect(html).toContain('</span> <span')
  })

  it('keeps the command text intact for copying', () => {
    const html = inlineMarkdown('Run `git config --global user.name "Ada Lovelace"` now')
    const text = html.replace(/<[^>]+>/g, '')
    expect(text).toBe('Run git config --global user.name "Ada Lovelace" now')
  })
})
