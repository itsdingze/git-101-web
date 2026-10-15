export class SandboxError extends Error {}

export class CourseExplanationError extends SandboxError {}

export const NOT_A_REPOSITORY =
  'fatal: not a git repository (or any of the parent directories): .git'

export const UNKNOWN_IDENTITY = [
  'Author identity unknown',
  '',
  '*** Please tell me who you are.',
  '',
  'Run',
  '',
  '  git config --global user.email "you@example.com"',
  '  git config --global user.name "Your Name"',
  '',
  "to set your account's default identity.",
  '',
  "fatal: unable to auto-detect email address (got 'user@sandbox.(none)')",
].join('\n')

type GitError = { code: string; data?: Record<string, unknown> }

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function isGitError(error: unknown): error is GitError & Error {
  return error instanceof Error && 'code' in error && typeof error.code === 'string'
}

function conflictingPaths(error: GitError): string {
  const filepaths = error.data?.filepaths
  if (!Array.isArray(filepaths)) return ''
  return filepaths.map((path) => `\t${String(path)}`).join('\n')
}

function unmergedLines(error: GitError): string[] {
  const filepaths = error.data?.filepaths
  if (!Array.isArray(filepaths)) return []
  return filepaths.map((path) => `U\t${String(path)}`)
}

export function describeGitError(error: unknown): string {
  if (error instanceof SandboxError) return error.message
  if (!isGitError(error)) return `fatal: ${error instanceof Error ? error.message : String(error)}`

  switch (error.code) {
    case 'NotFoundError':
      return `fatal: not a valid object name: '${asText(error.data?.what, 'HEAD')}'`
    case 'AlreadyExistsError':
      return `fatal: a branch named '${asText(error.data?.what)}' already exists`
    case 'InvalidRefNameError':
      return `fatal: '${asText(error.data?.ref)}' is not a valid branch name`
    case 'CheckoutConflictError':
      return [
        'error: Your local changes to the following files would be overwritten by checkout:',
        conflictingPaths(error),
        'Please commit your changes or stash them before you switch branches.',
        'Aborting',
      ]
        .filter(Boolean)
        .join('\n')
    case 'UnmergedPathsError':
      return [
        'error: Committing is not possible because you have unmerged files.',
        'hint: Fix them up in the work tree, and then use \'git add/rm <file>\'',
        'hint: as appropriate to mark resolution and make a commit.',
        'fatal: Exiting because of an unresolved conflict.',
        ...unmergedLines(error),
      ].join('\n')
    case 'FastForwardError':
      return 'fatal: Not possible to fast-forward, aborting.'
    case 'MissingNameError':
      return UNKNOWN_IDENTITY
    case 'MergeNotSupportedError':
      return "fatal: this course doesn't simulate this kind of merge."
    case 'InternalError':
      return 'fatal: files inside .git were edited, so this repository can no longer be read. Use Start over to reset the exercise.'
    default:
      return `fatal: ${error.message}`
  }
}
