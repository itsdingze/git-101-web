import { describe, expect, it } from 'vitest'
import type { TerminalTranscriptLine } from '@/types'
import { transcriptGroups } from './transcriptGroups'

const home = { directory: '~', branch: null }

describe('transcriptGroups', () => {
  it('keeps each command on its own and runs the lines it printed together, notes included', () => {
    const ls: TerminalTranscriptLine = { kind: 'command', prompt: home, text: 'ls', note: '' }
    const pwd: TerminalTranscriptLine = { kind: 'command', prompt: home, text: 'pwd', note: '' }
    const projects: TerminalTranscriptLine = { kind: 'output', text: 'projects', note: '' }
    const blank: TerminalTranscriptLine = { kind: 'output', text: '', note: '' }
    const note: TerminalTranscriptLine = { kind: 'note', text: '# your home folder' }
    const path: TerminalTranscriptLine = { kind: 'output', text: '/home/user', note: '' }

    expect(transcriptGroups([ls, projects, blank, note, pwd, path, pwd])).toEqual([
      { kind: 'command', line: ls },
      { kind: 'printed', lines: [projects, blank, note] },
      { kind: 'command', line: pwd },
      { kind: 'printed', lines: [path] },
      { kind: 'command', line: pwd },
    ])
  })

  it('leaves out a closing empty prompt that repeats the one before it', () => {
    const ls: TerminalTranscriptLine = { kind: 'command', prompt: home, text: 'ls', note: '' }
    const projects: TerminalTranscriptLine = { kind: 'output', text: 'projects', note: '' }
    const idle: TerminalTranscriptLine = { kind: 'command', prompt: home, text: '', note: '' }

    expect(transcriptGroups([ls, projects, idle])).toEqual([
      { kind: 'command', line: ls },
      { kind: 'printed', lines: [projects] },
    ])
  })

  it.each([
    ['a new folder', { directory: '~/todo-app', branch: null }, ''],
    ['a new branch', { directory: '~', branch: 'main' }, ''],
    ['a note', home, '# ready for the next command'],
  ])('keeps a closing empty prompt that shows %s', (_, prompt, note) => {
    const cd: TerminalTranscriptLine = { kind: 'command', prompt: home, text: 'cd todo-app', note: '' }
    const idle: TerminalTranscriptLine = { kind: 'command', prompt, text: '', note }

    expect(transcriptGroups([cd, idle])).toEqual([
      { kind: 'command', line: cd },
      { kind: 'command', line: idle },
    ])
  })

  it('starts with printed lines when a transcript opens on output', () => {
    const output: TerminalTranscriptLine = { kind: 'output', text: 'Welcome', note: '' }

    expect(transcriptGroups([output])).toEqual([{ kind: 'printed', lines: [output] }])
  })
})
