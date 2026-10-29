import { z } from 'zod'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'

const text = z.string().min(1)
const texts = z.array(text)
const count = z.number().int().min(0)

function bare<Kind extends string>(kind: Kind) {
  return z.strictObject({ kind: z.literal(kind) })
}

export const goalCheckSchema: z.ZodType<GoalCheck> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    bare('repo-initialized'),
    bare('repo-above-project'),
    bare('no-conflict-markers'),
    bare('markers-committed'),
    bare('markers-staged'),
    z.strictObject({ kind: z.literal('files-staged'), paths: texts }),
    z.strictObject({
      kind: z.literal('commit-exists'),
      containing: texts.optional(),
      modifies: texts.optional(),
      onBranch: text.optional(),
      messageIncludes: text.optional(),
    }),
    z.strictObject({ kind: z.literal('merge-commit-exists'), onBranch: text.optional() }),
    bare('merge-in-progress'),
    z.strictObject({ kind: z.literal('branch-exists'), name: text }),
    z.strictObject({ kind: z.literal('branch-absent'), name: text }),
    z.strictObject({ kind: z.literal('on-branch'), name: text }),
    z.strictObject({ kind: z.literal('file-present'), path: text }),
    z.strictObject({ kind: z.literal('file-absent'), path: text }),
    z.strictObject({ kind: z.literal('file-has-line'), path: text, line: z.string() }),
    z.strictObject({ kind: z.literal('file-matches'), path: text, lines: z.array(z.string()) }),
    bare('nested-repository'),
    bare('working-tree-clean'),
    z.strictObject({ kind: z.literal('up-to-date-with-remote'), branch: text }),
    z.strictObject({ kind: z.literal('pushed'), branch: text }),
    z.strictObject({ kind: z.literal('upstream-set'), branch: text }),
    z.strictObject({ kind: z.literal('clone-exists'), path: text }),
    z.strictObject({ kind: z.literal('stash-count'), count }),
    bare('stash-empty'),
    z.strictObject({ kind: z.literal('head-message'), includes: text }),
    z.strictObject({ kind: z.literal('file-tracked'), path: text }),
    z.strictObject({ kind: z.literal('file-untracked'), path: text }),
    z.strictObject({ kind: z.literal('commit-count'), count }),
    z.strictObject({ kind: z.literal('config-set'), key: text }),
    z.strictObject({ kind: z.literal('config-equals'), key: text, value: z.string() }),
    z.strictObject({ kind: z.literal('config-cut-short'), key: text }),
    z.strictObject({ kind: z.literal('config-multi-valued'), key: text }),
    z.strictObject({
      kind: z.literal('last-command'),
      startsWith: text,
      allowFailure: z.boolean().optional(),
      namesCommit: z.strictObject({ messageIncludes: text }).optional(),
    }),
    z.strictObject({ kind: z.literal('current-folder'), path: z.string() }),
    bare('gh-authenticated'),
    z.strictObject({ kind: z.literal('pr-open'), branch: text.optional() }),
    z.strictObject({ kind: z.literal('pr-merged'), branch: text.optional() }),
    z.strictObject({ kind: z.literal('not'), check: goalCheckSchema }),
    z.strictObject({ kind: z.literal('all-of'), checks: z.array(goalCheckSchema).min(1) }),
    z.strictObject({ kind: z.literal('any-of'), checks: z.array(goalCheckSchema).min(1) }),
  ]),
)
