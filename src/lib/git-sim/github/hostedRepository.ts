const GITHUB_ADDRESS = /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/

export function repositoryNameAt(url: string): string | null {
  return GITHUB_ADDRESS.exec(url)?.[1] ?? null
}

export function repositoryAddress(fullName: string): string {
  return `https://github.com/${fullName}.git`
}

export function pullRequestAddress(fullName: string, number: number): string {
  return `https://github.com/${fullName}/pull/${number}`
}
