function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
  return dp[m]![n]!
}

function normalize(command: string): string {
  return command.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Feedback is measured against whichever accepted command the learner is
 * closest to — telling someone on the `git checkout -b` path to use
 * `git switch` would be wrong when both are accepted.
 */
function closestTarget(actual: string, targets: string[]): string {
  return targets.reduce((best, target) =>
    levenshtein(actual, target) < levenshtein(actual, best) ? target : best,
  )
}

export default function getCommandFeedback(
  actual: string,
  expected: string,
  variants?: readonly string[],
): string | null {
  const actualNorm = normalize(actual)
  const targets = [expected, ...(variants ?? [])].map(normalize)

  if (targets.includes(actualNorm)) return null

  const target = closestTarget(actualNorm, targets)
  const actualTokens = actualNorm.split(' ')
  const targetTokens = target.split(' ')

  if (
    actualTokens[0] === 'git' &&
    targetTokens[0] === 'git' &&
    actualTokens.length > 1 &&
    targetTokens.length > 1 &&
    actualTokens[1] !== targetTokens[1]
  ) {
    const actualSub = actualTokens[1]!
    const targetSub = targetTokens[1]!
    if (levenshtein(actualSub, targetSub) <= 2) {
      return `Did you mean \`${targetSub}\` instead of \`${actualSub}\`?`
    }
    return `The right subcommand is \`git ${targetSub}\`, not \`git ${actualSub}\`.`
  }

  const actualFlags = actualTokens.filter((t) => t.startsWith('-'))
  const targetFlags = targetTokens.filter((t) => t.startsWith('-'))

  for (const flag of actualFlags) {
    if (!flag.startsWith('--') && flag.length > 1) {
      const doubleDash = '-' + flag
      if (targetFlags.includes(doubleDash)) {
        return `Use \`${doubleDash}\` (two dashes), not \`${flag}\`.`
      }
    }
  }

  for (const flag of targetFlags) {
    if (!actualFlags.includes(flag)) {
      return `You're missing the \`${flag}\` flag.`
    }
  }

  for (const flag of actualFlags) {
    if (!targetFlags.includes(flag)) {
      return `The \`${flag}\` flag is not needed here.`
    }
  }

  if (target.includes('"') && !actualNorm.includes('"') && !actualNorm.includes("'")) {
    return "Don't forget to put the message in quotes."
  }

  if (levenshtein(actualNorm, target) <= 2) {
    return 'Close! Check for typos.'
  }

  return null
}
