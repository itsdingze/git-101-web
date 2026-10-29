import { describe, expect, it } from 'vitest'
import { homeMeta, lessonMeta, notFoundMeta, summaryMeta, type LessonSummary } from './pageMeta'

const LESSONS: LessonSummary[] = [
  { id: 0, title: 'What is Git?', description: 'Understand what Git records' },
  { id: 1, title: 'The terminal', description: 'Run commands in a terminal' },
]

describe('home page metadata', () => {
  const meta = homeMeta(LESSONS)

  it('names the site and points at its root', () => {
    expect(meta.title).toBe("Git 101: Let's learn Git")
    expect(meta.canonical).toBe('https://itsdingze.github.io/git-101-web/')
    expect(meta.image.url).toBe('https://itsdingze.github.io/git-101-web/og/home.png')
    expect(meta.noindex).toBe(false)
  })

  it('describes the course and every lesson in it as structured data', () => {
    expect(meta.jsonLd).toMatchObject({
      '@type': 'Course',
      name: 'Git 101',
      isAccessibleForFree: true,
      hasPart: [
        { '@type': 'LearningResource', name: 'What is Git?', url: 'https://itsdingze.github.io/git-101-web/lesson/0/' },
        { '@type': 'LearningResource', name: 'The terminal', url: 'https://itsdingze.github.io/git-101-web/lesson/1/' },
      ],
    })
  })
})

describe('lesson page metadata', () => {
  const meta = lessonMeta(LESSONS[1]!)

  it('uses the lesson title, description, address and share image', () => {
    expect(meta).toMatchObject({
      title: 'The terminal — Git 101',
      description: 'Run commands in a terminal',
      canonical: 'https://itsdingze.github.io/git-101-web/lesson/1/',
      image: { url: 'https://itsdingze.github.io/git-101-web/og/lesson-1.png' },
      noindex: false,
    })
  })

  it('marks the lesson as part of the course', () => {
    expect(meta.jsonLd).toMatchObject({
      '@type': 'LearningResource',
      name: 'The terminal',
      position: 2,
      isPartOf: { '@type': 'Course', url: 'https://itsdingze.github.io/git-101-web/' },
    })
  })
})

describe('lesson summary page metadata', () => {
  const meta = summaryMeta(LESSONS[1]!)

  it('names the finished lesson and stays out of search results', () => {
    expect(meta).toMatchObject({
      title: 'The terminal complete — Git 101',
      canonical: null,
      image: { url: 'https://itsdingze.github.io/git-101-web/og/lesson-1.png' },
      noindex: true,
      jsonLd: null,
    })
  })
})

describe('not-found page metadata', () => {
  it('keeps the page out of search results and has no canonical address', () => {
    const meta = notFoundMeta()

    expect(meta.noindex).toBe(true)
    expect(meta.canonical).toBeNull()
    expect(meta.jsonLd).toBeNull()
  })
})
