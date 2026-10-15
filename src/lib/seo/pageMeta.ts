import { messages } from '../../messages/en'
import { SITE_URL, lessonPath, shareImagePath } from './site'

export interface LessonSummary {
  id: number
  title: string
  description: string
}

export interface PageMeta {
  title: string
  description: string
  canonical: string | null
  image: { url: string; alt: string }
  noindex: boolean
  jsonLd: Record<string, unknown> | null
}

const COURSE_REFERENCE = { '@type': 'Course', name: messages.app.name, url: SITE_URL }

const PROVIDER = { '@type': 'Person', name: 'itsdingze', url: 'https://github.com/itsdingze' }

function lessonResource(lesson: LessonSummary) {
  return {
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.description,
    url: SITE_URL + lessonPath(lesson.id),
    position: lesson.id + 1,
    learningResourceType: 'Lesson',
    inLanguage: 'en',
    isAccessibleForFree: true,
  }
}

export function homeMeta(lessons: readonly LessonSummary[]): PageMeta {
  return {
    title: messages.home.documentTitle,
    description: messages.home.description,
    canonical: SITE_URL,
    image: { url: SITE_URL + shareImagePath('home'), alt: messages.share.homeImageAlt },
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      ...COURSE_REFERENCE,
      description: messages.home.description,
      inLanguage: 'en',
      isAccessibleForFree: true,
      educationalLevel: 'Beginner',
      provider: PROVIDER,
      hasPart: lessons.map(lessonResource),
    },
  }
}

export function lessonMeta(lesson: LessonSummary): PageMeta {
  return {
    title: messages.lessonPage.documentTitle(lesson.title),
    description: lesson.description,
    canonical: SITE_URL + lessonPath(lesson.id),
    image: { url: SITE_URL + shareImagePath(lesson.id), alt: messages.share.lessonImageAlt(lesson.title) },
    noindex: false,
    jsonLd: { '@context': 'https://schema.org', ...lessonResource(lesson), isPartOf: COURSE_REFERENCE },
  }
}

export function notFoundMeta(): PageMeta {
  return {
    title: messages.app.pageNotFoundTitle,
    description: messages.home.description,
    canonical: null,
    image: { url: SITE_URL + shareImagePath('home'), alt: messages.share.homeImageAlt },
    noindex: true,
    jsonLd: null,
  }
}
