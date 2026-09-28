import { describe, expect, it } from 'vitest'
import { commandTip } from './commandTip'

const pathspecError = [{ stream: 'stderr' as const, text: "error: pathspec 'commit' did not match any file(s) known to git" }]
const quiet: { stream: 'stdout' | 'stderr'; text: string }[] = []
const failure = [{ stream: 'stderr' as const, text: 'fatal: bad thing' }]

describe('commandTip for commit messages', () => {
  it('asks for quotes around a multi-word commit message', () => {
    expect(commandTip('git commit -m first commit', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -m "first commit"`',
    )
    expect(commandTip('git commit -am Fix the year', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -am "Fix the year"`',
    )
  })

  it('handles --message and git stash push -m', () => {
    expect(commandTip('git commit --message first commit', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit --message "first commit"`',
    )
    expect(commandTip('git stash push -m two words', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git stash push -m "two words"`',
    )
  })

  it('treats words after the message that start with a dash as flags', () => {
    expect(commandTip('git commit -m Fix --amend', quiet)).toBeNull()
    expect(commandTip('git commit -m Fix -a', quiet)).toBeNull()
    expect(commandTip('git commit -m Fix the year --amend', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -m "Fix the year" --amend`',
    )
  })

  it('stays quiet when the message is quoted, even if it mentions -m', () => {
    expect(commandTip('git commit -m "first commit"', quiet)).toBeNull()
    expect(commandTip("git commit -m 'first commit'", quiet)).toBeNull()
    expect(commandTip('git commit -m "Explain -m and quotes"', quiet)).toBeNull()
    expect(commandTip('git commit -m first', quiet)).toBeNull()
  })

  it('asks for straight quotes when curly quotes were used', () => {
    expect(commandTip('git commit -m “first commit”', pathspecError)).toBe(
      'Those are curly quotes, which the terminal does not treat as quotes. Type straight quotes instead: `git commit -m "first commit"`',
    )
  })
})

describe('commandTip for names', () => {
  it('warns that an unquoted full name saves only the first word', () => {
    expect(commandTip('git config --global user.name Ada Lovelace', quiet)).toBe(
      'Only the first word, `Ada`, was saved as your name. Put your full name in quotes: `git config --global user.name "Ada Lovelace"`',
    )
    expect(commandTip('git config user.name Ada Lovelace', quiet)).toBe(
      'Only the first word, `Ada`, was saved as your name. Put your full name in quotes: `git config user.name "Ada Lovelace"`',
    )
  })

  it('explains a name Git refused to save', () => {
    expect(commandTip('git config --global user.name Ada King Lovelace', failure)).toBe(
      'Git could not read that as one name, so nothing was saved. Put your full name in quotes: `git config --global user.name "Ada King Lovelace"`',
    )
  })

  it('stays quiet for a quoted name or reading the name back', () => {
    expect(commandTip('git config --global user.name "Ada Lovelace"', quiet)).toBeNull()
    expect(commandTip('git config user.name', quiet)).toBeNull()
    expect(commandTip('git config --global user.name Ada', quiet)).toBeNull()
  })
})

describe('commandTip for copied text', () => {
  it('points out a copied prompt sign', () => {
    expect(commandTip('$ git status', [{ stream: 'stderr', text: 'command not found: $' }])).toBe(
      'Leave out the `$` at the start. It is the prompt, not part of the command.',
    )
  })

  it('points out a copied note when the command failed', () => {
    expect(commandTip('git init    # turn the folder into a repository', failure)).toBe(
      'Leave out the note after `#`. Copy only the command itself: `git init`',
    )
    expect(commandTip('git status #note', failure)).toBe(
      'Leave out the note after `#`. Copy only the command itself: `git status`',
    )
    expect(commandTip('git init    # note', [{ stream: 'stdout', text: 'Initialized' }])).toBeNull()
  })

  it('does not mistake a # inside quotes for a note', () => {
    expect(commandTip('echo "# My project" > README.md', failure)).toBeNull()
  })
})

describe('commandTip for merge direction', () => {
  it('explains which way git merge main goes when standing on another branch', () => {
    expect(commandTip('git merge main', [{ stream: 'stdout', text: 'Already up to date.' }], 'add-navbar')).toBe(
      'You are on `add-navbar`, so this brings `main` into `add-navbar`. If you meant to bring `add-navbar` into `main`, run `git switch main` first, then `git merge add-navbar`.',
    )
  })

  it('stays quiet on main or for other merges', () => {
    expect(commandTip('git merge main', quiet, 'main')).toBeNull()
    expect(commandTip('git merge add-navbar', quiet, 'main')).toBeNull()
    expect(commandTip('git merge main', quiet, null)).toBeNull()
  })
})

describe('commandTip for a project with no remote yet', () => {
  const noOrigin = [
    { stream: 'stderr' as const, text: "fatal: 'origin' does not appear to be a git repository\nfatal: Could not read from remote repository." },
  ]
  const noDestination = [{ stream: 'stderr' as const, text: 'fatal: No configured push destination.' }]
  const connectTip =
    'This project is not connected to GitHub yet, so there is nowhere to send it. Connect it first with `git remote add origin <url>`, using the address of your GitHub repository, then try again.'

  it('explains that the remote has to be added first', () => {
    expect(commandTip('git push -u origin main', noOrigin)).toBe(connectTip)
    expect(commandTip('git push', noDestination)).toBe(connectTip)
  })

  it('stays quiet when the push worked', () => {
    expect(commandTip('git push -u origin main', quiet)).toBeNull()
  })
})

describe('commandTip for everything else', () => {
  it('says nothing about ordinary commands', () => {
    expect(commandTip('git status', quiet)).toBeNull()
  })
})
