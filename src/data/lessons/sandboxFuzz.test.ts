import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { NO_LOCKS, type CommandLocks } from '@/lib/git-sim/commandLocks'
import lessons from './index'
import { commandLocksFor } from './commandLocks'

const RUNS_PER_TARGET = 2
const COMMANDS_PER_RUN = 30
const COMMAND_TIMEOUT_MS = 2000

const LEAKED_INTERNALS =
  /\bundefined\b|\bNaN\b|\[object |TypeError|ReferenceError|RangeError|Cannot read prop|is not a function|is not iterable|Maximum call stack|(?<!\/dev\/)\bnull\b|ENOENT|EEXIST|ENOTDIR|EISDIR|ENOTEMPTY|isomorphic-git|Could not find/

type Random = () => number

function seededRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(random: Random, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)] as T
}

type KnownNames = {
  files: readonly string[]
  branches: readonly string[]
}

const ODD_PATHS = ['', '.', '..', '~', '/', '.git', 'a b', '\\', '-', '*', 'missing/deep/file.txt', 'x'.repeat(200)]
const REVISIONS = ['HEAD', 'HEAD~1', 'HEAD~9', 'HEAD^', 'HEAD@{1}', 'HEAD@{99}', 'main', 'origin/main', 'nope', 'stash@{0}']
const STASH_REFS = ['stash@{0}', 'stash@{1}', 'stash@{9}', '1', 'stash@{x}', 'main']
const BRANCH_NAMES = ['feature', 'feature/add-auth', 'fix/typo', 'main', 'bad~name', '-b', 'HEAD']
const MESSAGES = ['"Fix the thing"', '""', '"a" -m "b"', "'single'", '"unterminated']
const URLS = ['https://github.com/supper-club/cookbook.git', 'https://github.com/nobody/nothing.git', 'notaurl']

function fileName(random: Random, known: KnownNames): string {
  if (random() < 0.15 || known.files.length === 0) return pick(random, [...ODD_PATHS, 'new.txt', 'dir'])
  return pick(random, known.files)
}

function branchName(random: Random, known: KnownNames): string {
  return random() < 0.5 && known.branches.length > 0 ? pick(random, known.branches) : pick(random, BRANCH_NAMES)
}

function gitLine(random: Random, known: KnownNames): string {
  const file = () => fileName(random, known)
  const branch = () => branchName(random, known)
  const revision = () => pick(random, REVISIONS)

  return pick(random, [
    () => `git status ${pick(random, ['', '-s', '--ignored'])}`,
    () => `git add ${pick(random, ['.', '-A', file(), `-f ${file()}`])}`,
    () => `git commit ${pick(random, [`-m ${pick(random, MESSAGES)}`, `-am ${pick(random, MESSAGES)}`, '--amend --no-edit', ''])}`,
    () => `git log ${pick(random, ['', '--oneline --graph', '-n 2', revision()])}`,
    () => `git diff ${pick(random, ['', '--staged', revision(), `${revision()} ${revision()}`, `-- ${file()}`])}`,
    () => `git branch ${pick(random, ['', '-a', branch(), `-d ${branch()}`, `-D ${branch()}`])}`,
    () => `git switch ${pick(random, [branch(), `-c ${branch()}`, `-c ${branch()} ${revision()}`, '-'])}`,
    () => `git checkout ${pick(random, [branch(), `-b ${branch()}`, `-- ${file()}`, '.'])}`,
    () => `git merge ${pick(random, [branch(), '--abort', `--no-edit ${branch()}`])}`,
    () => `git stash ${pick(random, ['', '-u', 'list', 'pop', 'show', `pop ${pick(random, STASH_REFS)}`, `drop ${pick(random, STASH_REFS)}`])}`,
    () => `git restore ${pick(random, [file(), `--staged ${file()}`, '.'])}`,
    () => `git reset ${pick(random, ['', `--soft ${revision()}`, `--hard ${revision()}`, `HEAD ${file()}`])}`,
    () => `git revert ${pick(random, [revision(), '--no-edit HEAD'])}`,
    () => `git ${pick(random, ['reflog', 'init', 'config --list', 'remote -v', 'help', 'rebase main', 'blah'])}`,
    () => `git rm ${pick(random, [file(), `--cached ${file()}`, `-r ${file()}`])}`,
    () => `git remote add ${pick(random, ['origin', 'upstream'])} ${pick(random, URLS)}`,
    () => `git ${pick(random, ['fetch', 'pull', 'push', 'pull --no-rebase', 'push -u origin main', 'push --force'])}`,
    () => `git clone ${pick(random, URLS)} ${pick(random, ['', 'copy', '.', file()])}`,
  ])()
}

function shellLine(random: Random, known: KnownNames): string {
  const file = () => fileName(random, known)

  return pick(random, [
    () => `echo "${pick(random, ['hello', ''])}" ${pick(random, ['>', '>>'])} ${file()}`,
    () => `cat ${file()}`,
    () => `ls ${pick(random, ['', '-a', file()])}`,
    () => `cd ${pick(random, ['..', '~', '', file()])}`,
    () => `touch ${file()}`,
    () => `mkdir ${pick(random, ['dir', '-p dir/sub', '.git'])}`,
    () => `rm ${pick(random, ['', '-r ', '-f '])}${pick(random, [file(), '.', '..', '~', '.git'])}`,
    () => `mv ${file()} ${file()}`,
    () => pick(random, ['echo junk > .git/HEAD', 'echo junk > .git/index', 'rm -r .git/objects', 'rm -r .git']),
    () => pick(random, ['pwd', 'help', 'clear', 'vim notes', 'echo a >', '>', '   ']),
  ])()
}

function randomLine(random: Random, known: KnownNames): string {
  return random() < 0.7 ? gitLine(random, known) : shellLine(random, known)
}

type FuzzTarget = {
  name: string
  seed: SandboxSeed
  locks: CommandLocks
}

function fuzzTargets(): FuzzTarget[] {
  return lessons.flatMap((lesson) =>
    lesson.steps.flatMap((step) =>
      step.type === 'sandbox-exercise'
        ? [
            { name: `${step.id} with lesson ${lesson.id} locks`, seed: step.seed, locks: commandLocksFor(lesson.id) },
            { name: `${step.id} unlocked`, seed: step.seed, locks: NO_LOCKS },
          ]
        : [],
    ),
  )
}

function withinTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`no answer within ${COMMAND_TIMEOUT_MS}ms`)), COMMAND_TIMEOUT_MS)
    }),
  ])
}

async function observableState(sandbox: Sandbox): Promise<string> {
  return JSON.stringify({ snapshot: await sandbox.snapshot(), prompt: await sandbox.prompt() })
}

function lockedByLine(line: string, locks: CommandLocks): boolean {
  const [program, subcommand] = line.trim().split(/\s+/)
  return program === 'git' && subcommand !== undefined && locks.has(subcommand)
}

async function fuzzRun(target: FuzzTarget, runSeed: number): Promise<void> {
  const random = seededRandom(runSeed)
  const sandbox = await createSandbox(target.seed, target.locks)
  const initialState = await observableState(sandbox)
  const history: string[] = []
  let known: KnownNames = { files: [], branches: [] }

  const context = () => `run seed ${runSeed}, after:\n  ${history.slice(-10).join('\n  ')}`

  for (let step = 0; step < COMMANDS_PER_RUN; step += 1) {
    const line = randomLine(random, known)
    history.push(line)
    const stateBefore = await observableState(sandbox)

    const result = await withinTimeout(sandbox.run(line)).catch((error: unknown) => {
      throw new Error(`${String(error)} (${context()})`)
    })
    for (const output of result.outputs) {
      expect(output.text, context()).not.toMatch(LEAKED_INTERNALS)
    }

    const stateAfter = await withinTimeout(observableState(sandbox))
    if (lockedByLine(line, target.locks)) expect(stateAfter, context()).toBe(stateBefore)

    const { snapshot } = JSON.parse(stateAfter) as { snapshot: { workdirFiles: string[]; tracked: string[]; branches: string[] } }
    known = { files: [...new Set([...snapshot.workdirFiles, ...snapshot.tracked])], branches: snapshot.branches }
  }

  await sandbox.reset()
  expect(await observableState(sandbox), `reset did not restore the start (${context()})`).toBe(initialState)
}

describe.each(fuzzTargets())('random commands in $name', (target) => {
  it('never crash, hang, leak internals, run while locked, or survive a reset', async () => {
    for (let run = 0; run < RUNS_PER_TARGET; run += 1) {
      await fuzzRun(target, (target.name.length * 7919 + run * 104729) >>> 0)
    }
  })
})
