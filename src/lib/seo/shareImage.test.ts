import { describe, expect, it } from 'vitest'
import regularFont from '@fontsource/inter/files/inter-latin-400-normal.woff?inline'
import semiboldFont from '@fontsource/inter/files/inter-latin-600-normal.woff?inline'
import { renderShareImage, sharePalette } from './shareImage'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const TOKENS = `
  --color-bg-primary: #ffffff;
  --color-accent-green: #58a700;
  --color-accent-green-strong: #3b7300;
  --color-text-primary: #4b4b4b;
  --color-text-secondary: #5a5a5a;
  --color-text-muted: #696969;
`

function bytesOf(dataUrl: string): Uint8Array {
  return Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (char) => char.charCodeAt(0))
}

function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

describe('sharePalette', () => {
  it('takes the card colours from the design tokens', () => {
    expect(sharePalette(TOKENS)).toEqual({
      background: '#ffffff',
      stripe: '#58a700',
      eyebrow: '#3b7300',
      title: '#4b4b4b',
      body: '#5a5a5a',
      muted: '#696969',
    })
  })

  it('names the token that is missing', () => {
    expect(() => sharePalette('--color-bg-primary: #ffffff;')).toThrow('--color-accent-green')
  })
})

describe('renderShareImage', () => {
  it('draws a 1200 by 630 PNG card', async () => {
    const png = await renderShareImage(
      { eyebrow: 'Lesson 1', title: 'The terminal', description: 'Run commands in a terminal and move between folders' },
      { regularFont: bytesOf(regularFont), semiboldFont: bytesOf(semiboldFont), palette: sharePalette(TOKENS) },
    )

    expect([...png.slice(0, 8)]).toEqual(PNG_SIGNATURE)
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 })
  })
})
