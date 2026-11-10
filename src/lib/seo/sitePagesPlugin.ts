import type { Plugin, Rollup } from 'vite'
import { messages } from '../../messages/en'
import { homeMeta, lessonMeta, notFoundMeta, summaryMeta, type LessonSummary } from './pageMeta'
import { renderHead } from './renderHead'
import { renderShareImage, sharePalette, type ShareCard, type ShareImageAssets } from './shareImage'
import { sitemapXml } from './sitemap'
import { lessonPath, lessonSummaryPath, shareImagePath } from './site'
import { readLessons } from './readLessons'
import { homeBody, lessonBody, notFoundBody, summaryBody, type LessonArticle } from './staticBody'

const FONT_FOLDER = 'node_modules/@fontsource/inter/files'
const EMPTY_ROOT = '<div id="root"></div>'

function withHead(html: string, head: string): string {
  return html.replace('</head>', () => `  ${head}\n  </head>`)
}

function withBody(html: string, body: string): string {
  if (!html.includes(EMPTY_ROOT)) throw new Error('site-pages needs an empty root element in index.html')
  return html.replace(EMPTY_ROOT, () => `<div id="root">${body}</div>`)
}

async function readShareAssets(fs: Rollup.RollupFsModule, root: string): Promise<ShareImageAssets> {
  return {
    regularFont: await fs.readFile(`${root}/${FONT_FOLDER}/inter-latin-400-normal.woff`),
    semiboldFont: await fs.readFile(`${root}/${FONT_FOLDER}/inter-latin-600-normal.woff`),
    palette: sharePalette(await fs.readFile(`${root}/src/index.css`, { encoding: 'utf8' })),
  }
}

function shareCards(lessons: readonly LessonSummary[]): [string, ShareCard][] {
  return [
    [shareImagePath('home'), { eyebrow: messages.share.homeEyebrow, title: messages.home.hero.title, description: messages.home.description }],
    ...lessons.map((lesson): [string, ShareCard] => [
      shareImagePath(lesson.id),
      { eyebrow: messages.share.lessonEyebrow(lesson.id), title: lesson.title, description: lesson.description },
    ]),
  ]
}

export function sitePages(): Plugin {
  let root = ''
  let lessons: LessonArticle[] = []

  return {
    name: 'site-pages',
    enforce: 'post',
    configResolved(config) {
      root = config.root
    },
    async buildStart() {
      lessons = await readLessons(this.fs, root)
    },
    transformIndexHtml(html) {
      return withHead(html, renderHead(homeMeta(lessons)))
    },
    async generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (index?.type !== 'asset' || typeof index.source !== 'string') throw new Error('site-pages runs after Vite emits index.html')
      const homeHtml = index.source
      const homeHead = renderHead(homeMeta(lessons))
      if (!homeHtml.includes(homeHead)) throw new Error('index.html lost the page head that site-pages added')
      const pageHtml = (head: string, body: string) => withBody(homeHtml.replace(homeHead, () => head), body)

      index.source = pageHtml(homeHead, homeBody(lessons))
      for (const lesson of lessons) {
        const source = pageHtml(renderHead(lessonMeta(lesson)), lessonBody(lesson))
        this.emitFile({ type: 'asset', fileName: `${lessonPath(lesson.id)}index.html`, source })
        const summary = pageHtml(renderHead(summaryMeta(lesson)), summaryBody(lesson))
        this.emitFile({ type: 'asset', fileName: `${lessonSummaryPath(lesson.id)}index.html`, source: summary })
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: pageHtml(renderHead(notFoundMeta()), notFoundBody()) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(lessons) })

      const assets = await readShareAssets(this.fs, root)
      for (const [fileName, card] of shareCards(lessons)) {
        this.emitFile({ type: 'asset', fileName, source: await renderShareImage(card, assets) })
      }
    },
  }
}
