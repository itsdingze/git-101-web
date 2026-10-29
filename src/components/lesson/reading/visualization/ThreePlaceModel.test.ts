// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThreePlaceModel } from './ThreePlaceModel'

const model = {
  files: ['app.py', 'notes.md'],
  ignored: ['debug.log'],
  stageFirst: 'app.py',
  commitMessage: 'Add app',
}

function runCommand(name: string) {
  const command = screen.getByRole('button', { name })
  command.focus()
  fireEvent.click(command)
}

afterEach(cleanup)

describe('ThreePlaceModel', () => {
  it('moves focus to the finished message once the last command runs', () => {
    render(createElement(ThreePlaceModel, model))
    expect(document.activeElement).toBe(document.body)

    runCommand('$ git add app.py')
    runCommand('$ git add .')
    runCommand('$ git commit -m "Add app"')

    expect(document.activeElement?.textContent).toBe(
      'This commit records the staged files. Your files are still in the working directory.',
    )
  })

  it('announces what each command changed', () => {
    render(createElement(ThreePlaceModel, model))
    expect(screen.getByRole('status').textContent).toBe('')

    runCommand('$ git add app.py')
    expect(screen.getByRole('status').textContent).toBe(
      'Ran git add app.py. Staging area: app.py. Repository history: empty.',
    )

    runCommand('$ git add .')
    runCommand('$ git commit -m "Add app"')
    expect(screen.getByRole('status').textContent).toBe(
      'Ran git commit -m "Add app". Staging area: empty. Repository history: app.py and notes.md.',
    )
  })
})
