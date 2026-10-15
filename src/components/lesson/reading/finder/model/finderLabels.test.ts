import { describe, expect, it } from 'vitest'
import { entryLabel, folderListLabel } from './finderLabels'

describe('folderListLabel', () => {
  it('names the folder by its full path', () => {
    expect(folderListLabel(['home', 'user', 'todo-app'], 2)).toBe('Files in /home/user/todo-app')
  })

  it('names the root folder by its slash', () => {
    expect(folderListLabel([], 1)).toBe('Files in /')
  })

  it('says when the folder is empty', () => {
    expect(folderListLabel(['home', 'user', 'notes'], 0)).toBe('Files in /home/user/notes, an empty folder')
  })
})

describe('entryLabel', () => {
  it('reads a file by its name, and marks folders and hidden entries', () => {
    expect(
      [
        entryLabel({ name: 'app.txt', kind: 'file', hidden: false }),
        entryLabel({ name: 'notes', kind: 'folder', hidden: false, entries: [] }),
        entryLabel({ name: '.git', kind: 'folder', hidden: true, entries: [] }),
      ],
    ).toEqual(['app.txt', 'notes (folder)', '.git (hidden folder)'])
  })
})
