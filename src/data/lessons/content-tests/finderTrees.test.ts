import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { ContentBlock, FileEntry, FilesBlock } from '@/types'
import { lessons } from '@/data/lessons'

type FinderMoment = {
  lesson: number
  path: string
  seed: SandboxSeed
  then?: readonly string[]
}

const HOME = '/home/user'
const INDENT = '  '

function exerciseSeed(stepId: string): SandboxSeed {
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type === 'sandbox-exercise' && step.id === stepId) return step.seed
    }
  }
  throw new Error(`no sandbox step with id ${stepId}`)
}

const MOMENTS: readonly FinderMoment[] = [
  { lesson: 1, path: '~', seed: exerciseSeed('find-your-way') },
  { lesson: 1, path: '~/projects/recipes', seed: exerciseSeed('find-your-way') },
  { lesson: 2, path: '~/projects/todo-app', seed: exerciseSeed('start-the-project') },
  { lesson: 2, path: '~/projects/todo-app', seed: exerciseSeed('start-the-project'), then: ['cd projects/todo-app', 'git init'] },
]

function filesBlocksIn(content: readonly ContentBlock[]): FilesBlock[] {
  return content.flatMap((block) => {
    if (block.type === 'files') return [block]
    if (block.type === 'tabs') return block.tabs.flatMap((tab) => filesBlocksIn(tab.content))
    return []
  })
}

function courseFilesBlocks(): { lesson: number; block: FilesBlock }[] {
  return lessons.flatMap((lesson) =>
    lesson.steps.flatMap((step) =>
      step.type === 'reading' ? filesBlocksIn(step.content).map((block) => ({ lesson: lesson.id, block })) : [],
    ),
  )
}

function treeLines(entries: readonly FileEntry[], depth = 0): string[] {
  return entries.flatMap((entry) =>
    entry.kind === 'folder'
      ? [`${INDENT.repeat(depth)}${entry.name}/`, ...treeLines(entry.entries, depth + 1)]
      : [`${INDENT.repeat(depth)}${entry.name}`],
  )
}

async function sandboxTreeLines(sandbox: Sandbox, path: string, depth = 0): Promise<string[]> {
  const result = await sandbox.run(`ls -la ${path}`)
  const names = result.outputs
    .map((output) => output.text)
    .join('\n')
    .split('\n')
    .filter((name) => name && name !== './' && name !== '../')

  const lines: string[] = []
  for (const name of names) {
    lines.push(`${INDENT.repeat(depth)}${name}`)
    if (name.endsWith('/')) lines.push(...(await sandboxTreeLines(sandbox, `${path}/${name.slice(0, -1)}`, depth + 1)))
  }
  return lines
}

async function sandboxHomeAt(moment: FinderMoment): Promise<string[]> {
  const sandbox = await createSandbox(moment.seed)
  for (const line of moment.then ?? []) await sandbox.run(line)
  return sandboxTreeLines(sandbox, HOME)
}

describe('Finder windows', () => {
  const blocks = courseFilesBlocks()

  it('each match a moment in the story, in course order', () => {
    expect(blocks.map(({ lesson, block }) => `${lesson} ${block.path}`)).toEqual(
      MOMENTS.map(({ lesson, path }) => `${lesson} ${path}`),
    )
  })

  it.each(MOMENTS.map((moment, index) => [index + 1, moment] as const))(
    'window %i shows the files the sandbox holds at that moment',
    async (index, moment) => {
      const shown = blocks[index - 1]?.block.home ?? []

      expect(treeLines(shown).join('\n')).toBe((await sandboxHomeAt(moment)).join('\n'))
    },
  )
})
