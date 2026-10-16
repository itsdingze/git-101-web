import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { messages } from '../../messages/en'
import { SHARE_IMAGE_SIZE } from './renderHead'
import { SITE_URL } from './site'

export interface ShareCard {
  eyebrow: string
  title: string
  description: string
}

export interface SharePalette {
  background: string
  stripe: string
  eyebrow: string
  title: string
  body: string
  muted: string
}

export interface ShareImageAssets {
  regularFont: Uint8Array
  semiboldFont: Uint8Array
  palette: SharePalette
}

type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string } }

const PALETTE_TOKENS: Record<keyof SharePalette, string> = {
  background: 'bg-primary',
  stripe: 'accent-green',
  eyebrow: 'accent-green-strong',
  title: 'text-primary',
  body: 'text-secondary',
  muted: 'text-muted',
}

export function sharePalette(css: string): SharePalette {
  const theme = css.match(/@theme\s*\{([^}]*)\}/)?.[1] ?? ''
  const tokens = new Map([...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/g)].map(([, name, value]) => [name, value]))
  const colorOf = (token: string): string => {
    const value = tokens.get(token)
    if (!value) throw new Error(`index.css has no --color-${token} for the share images`)
    return value
  }
  return {
    background: colorOf(PALETTE_TOKENS.background),
    stripe: colorOf(PALETTE_TOKENS.stripe),
    eyebrow: colorOf(PALETTE_TOKENS.eyebrow),
    title: colorOf(PALETTE_TOKENS.title),
    body: colorOf(PALETTE_TOKENS.body),
    muted: colorOf(PALETTE_TOKENS.muted),
  }
}

function box(style: Record<string, unknown>, children: Node[] | string): Node {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children } }
}

function card({ eyebrow, title, description }: ShareCard, palette: SharePalette): Node {
  return box(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      background: palette.background,
      borderBottom: `16px solid ${palette.stripe}`,
      fontFamily: 'Inter',
    },
    [
      box({ flexDirection: 'column', gap: 24 }, [
        box({ fontSize: 30, fontWeight: 600, color: palette.eyebrow }, eyebrow),
        box({ fontSize: 72, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1.5, color: palette.title }, title),
        box({ fontSize: 32, lineHeight: 1.4, color: palette.body, maxWidth: 960 }, description),
      ]),
      box({ justifyContent: 'space-between', fontSize: 28, color: palette.muted }, [
        box({ fontWeight: 600, color: palette.title }, messages.app.name),
        box({}, SITE_URL.replace(/^https:\/\//, '').replace(/\/$/, '')),
      ]),
    ],
  )
}

export async function renderShareImage(content: ShareCard, assets: ShareImageAssets): Promise<Uint8Array> {
  const svg = await satori(card(content, assets.palette) as Parameters<typeof satori>[0], {
    ...SHARE_IMAGE_SIZE,
    fonts: [
      { name: 'Inter', data: assets.regularFont, weight: 400, style: 'normal' },
      { name: 'Inter', data: assets.semiboldFont, weight: 600, style: 'normal' },
    ],
  })
  return new Uint8Array(new Resvg(svg).render().asPng())
}
