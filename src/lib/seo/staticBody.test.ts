import { describe, expect, it } from 'vitest'
import type { Step } from '@/types'
import { homeBody, lessonBody, notFoundBody, summaryBody, type LessonArticle } from './staticBody'

const READING: Step = {
  type: 'reading',
  id: 'save-points',
  title: 'Save points',
  content: [
    { type: 'text', value: 'Run `git add` to **stage** <files>. See [the book](https://git-scm.com/book).' },
    { type: 'list', items: ['First item', 'Second item'] },
    { type: 'code', language: 'bash', value: 'git status' },
    { type: 'callout', variant: 'tip', title: 'Unsure?', value: 'Check first.' },
    {
      type: 'terminal',
      lines: [
        { kind: 'command', prompt: { directory: '~', branch: null }, text: 'git log', note: '' },
        { kind: 'output', text: 'abc1234 feat: start', note: '' },
      ],
    },
    {
      type: 'tabs',
      group: 'os',
      label: 'Choose',
      tabs: [{ label: 'macOS', content: [{ type: 'text', value: 'Open Terminal.' }] }],
    },
  ],
}

const QUIZ: Step = {
  type: 'quiz',
  id: 'quiz',
  question: 'Hidden question?',
  options: [{ text: 'Hidden option' }],
  correctIndex: 0,
  explanation: 'Hidden explanation',
}

const LESSON: LessonArticle = { id: 3, title: 'Your <first> commit', description: 'Stage & commit', steps: [READING, QUIZ] }

describe('lessonBody', () => {
  const html = lessonBody(LESSON)

  it('gives visitors without JavaScript the reading text', () => {
    expect(html).toContain('Your &lt;first&gt; commit')
    expect(html).toContain('Stage &amp; commit')
    expect(html).toContain('Save points')
    expect(html).toContain('First item')
    expect(html).toContain('git status')
    expect(html).toContain('Unsure?')
    expect(html).toContain('abc1234 feat: start')
    expect(html).toContain('Open Terminal.')
  })

  it('renders inline Markdown and escapes the rest', () => {
    expect(html).toContain('<code>git add</code>')
    expect(html).toContain('<strong>stage</strong>')
    expect(html).toContain('&lt;files&gt;')
    expect(html).toContain('href="https://git-scm.com/book"')
    expect(html).not.toContain('<files>')
  })

  it('links the project download under the site path', () => {
    const downloads = lessonBody({
      ...LESSON,
      steps: [{ type: 'reading', id: 'd', content: [{ type: 'text', value: '[Download todo-app.zip](/downloads/todo-app.zip)' }] }],
    })

    expect(downloads).toContain('href="/git-101-web/downloads/todo-app.zip"')
    expect(downloads).not.toContain('](/downloads')
  })

  it('lists a folder tree as text, with the folder it opens at', () => {
    const tree = lessonBody({
      ...LESSON,
      steps: [
        {
          type: 'reading',
          id: 'folders',
          content: [
            {
              type: 'files',
              path: '~/projects',
              home: [
                { name: 'letter.txt', kind: 'file', hidden: false },
                {
                  name: 'projects',
                  kind: 'folder',
                  hidden: false,
                  entries: [
                    { name: '.git', kind: 'folder', hidden: true, entries: [] },
                    { name: 'a<b>.txt', kind: 'file', hidden: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(tree).toContain('<code>~/projects</code>')
    expect(tree).toContain(['letter.txt', 'projects/', '  .git/', '  a&lt;b&gt;.txt'].join('\n'))
  })

  it('leaves practice to the interactive page', () => {
    expect(html).not.toContain('Hidden')
  })

  it('swaps the article for a placeholder when JavaScript runs', () => {
    expect(html).toMatch(/<article class="[^"]*js:hidden/)
    expect(html).toMatch(/<div aria-hidden="true" class="[^"]*hidden js:flex/)
  })

  it('tells visitors without JavaScript that practice needs it', () => {
    expect(html).toMatch(/<noscript>.*JavaScript.*<\/noscript>/s)
  })
})

describe('homeBody', () => {
  it('links every lesson under the site path', () => {
    const html = homeBody([LESSON, { ...LESSON, id: 4, title: 'Next' }])

    expect(html).toContain('href="/git-101-web/lesson/3/"')
    expect(html).toContain('href="/git-101-web/lesson/4/"')
    expect(html).toContain('<h1')
    expect(html).toContain('Stage &amp; commit')
  })
})

describe('summaryBody', () => {
  it('names the lesson and links back to it', () => {
    const html = summaryBody(LESSON)

    expect(html).toContain('Your &lt;first&gt; commit')
    expect(html).toContain('href="/git-101-web/lesson/3/"')
  })
})

describe('notFoundBody', () => {
  it('links home from any depth', () => {
    expect(notFoundBody()).toContain('href="/git-101-web/"')
  })
})
