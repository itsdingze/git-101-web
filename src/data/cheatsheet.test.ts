import { describe, expect, it } from 'vitest'
import type { Lesson } from '@/types'
import { lessonById } from '@/data/lessons/index'
import { cheatsheet } from './cheatsheet'

function literalPart(command: string): string {
  return command.split(/[<"]/)[0]?.trim() ?? command
}

function lessonText(lesson: Lesson): string {
  return JSON.stringify(lesson.steps)
}

const entries = cheatsheet.flatMap((category) => category.commands)
const DESTRUCTIVE = /reset --hard|push --force|branch -D|\bclean\b|^git restore <file>$/

describe('cheat sheet', () => {
  it.each(entries)('credits `$command` to the lesson that teaches it', ({ command, lessonId }) => {
    const lesson = lessonById(lessonId)
    expect(lesson, `no lesson ${lessonId}`).toBeDefined()
    expect(lesson && lessonText(lesson)).toContain(literalPart(command))
  })

  it('leaves out the shell commands the course never teaches', () => {
    const commands = entries.map((entry) => entry.command.split(' ')[0])
    expect(commands.filter((name) => ['cat', 'echo', 'mkdir', 'rm', 'touch', 'mv'].includes(name ?? ''))).toEqual([])
  })

  it.each(entries.filter((entry) => DESTRUCTIVE.test(entry.command)))('warns about `$command`', ({ danger }) => {
    expect(danger).toBeTruthy()
  })
})
