import type { Plugin } from 'vite'
import type { RollupFsModule } from 'rollup'
import { messages } from '../../messages/en'
import { homeMeta, lessonMeta, notFoundMeta, type LessonSummary } from './pageMeta'
import { renderHead } from './renderHead'
import { renderShareImage, sharePalette, type ShareCard, type ShareImageAssets } from './shareImage'
import { sitemapXml } from './sitemap'
import { lessonPath, shareImagePath } from './site'
import { readLessons } from './readLessons'

const FONT_FOLDER = 'node_modules/@fontsource/inter/files'

function withHead(html: string, head: string): string {
  return html.replace('</head>', () => `  ${head}\n  </head>`)
}

async function readShareAssets(fs: RollupFsModule, root: string): Promise<ShareImageAssets> {
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
  let lessons: LessonSummary[] = []

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
      const pageHtml = (head: string) => homeHtml.replace(homeHead, () => head)

      for (const lesson of lessons) {
        const source = pageHtml(renderHead(lessonMeta(lesson)))
        this.emitFile({ type: 'asset', fileName: `${lessonPath(lesson.id)}index.html`, source })
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: pageHtml(renderHead(notFoundMeta())) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(lessons) })

      const assets = await readShareAssets(this.fs, root)
      for (const [fileName, card] of shareCards(lessons)) {
        this.emitFile({ type: 'asset', fileName, source: await renderShareImage(card, assets) })
      }
    },
  }
}
