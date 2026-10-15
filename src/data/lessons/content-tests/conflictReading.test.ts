import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { lessonById } from '@/data/lessons'

describe('the conflict marker editor view', () => {
  it('shows the unresolved file produced by pulling main into the practice branch', async () => {
    const lesson = lessonById(10)
    const reading = lesson?.steps.find((step) => step.type === 'reading' && step.id === 'conflict-markers')
    const practice = lesson?.steps.find((step) => step.type === 'sandbox-exercise' && step.id === 'resolve-a-conflict')
    if (reading?.type !== 'reading' || practice?.type !== 'sandbox-exercise') {
      throw new Error('Missing conflict reading or practice')
    }
    const editor = reading.content.find((block) => block.type === 'diff' && block.fileName === 'app.py')
    if (editor?.type !== 'diff') throw new Error('Missing static app.py editor view')

    expect(reading.visualization).toBeUndefined()
    expect(editor.lines.every((line) => line.change === 'unchanged')).toBe(true)

    const sandbox = await createSandbox(practice.seed)
    await sandbox.run('git pull origin main')
    const result = await sandbox.run('cat app.py')
    const contents = result.outputs.map((output) => output.text).join('\n')
    const shown = editor.lines.map((line) => line.text).join('\n')

    expect(contents).toContain(shown)
    expect(shown).toContain('<<<<<<< HEAD')
    expect(shown).toContain('=======')
    expect(shown).toContain('>>>>>>> ')
  })
})
