export type RejectionReason = 'fetch first' | 'non-fast-forward' | 'stale info'

const HINTS: Record<RejectionReason, readonly string[]> = {
  'fetch first': [
    'Updates were rejected because the remote contains work that you do not',
    'have locally. This is usually caused by another repository pushing to',
    'the same ref. If you want to integrate the remote changes, use',
    "'git pull' before pushing again.",
    "See the 'Note about fast-forwards' in 'git push --help' for details.",
  ],
  'non-fast-forward': [
    'Updates were rejected because the tip of your current branch is behind',
    'its remote counterpart. If you want to integrate the remote changes,',
    "use 'git pull' before pushing again.",
    "See the 'Note about fast-forwards' in 'git push --help' for details.",
  ],
  'stale info': [],
}

export function describeRejection(
  url: string,
  branch: string,
  remoteBranch: string,
  reason: RejectionReason,
): string {
  return [
    `To ${url}`,
    ` ! [rejected]        ${branch} -> ${remoteBranch} (${reason})`,
    `error: failed to push some refs to '${url}'`,
    ...HINTS[reason].map((hint) => `hint: ${hint}`),
  ].join('\n')
}
