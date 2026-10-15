export type PullRequestState = 'OPEN' | 'MERGED'

export type PullRequest = {
  number: number
  title: string
  body: string
  head: string
  base: string
  author: string
  state: PullRequestState
  approvedBy: string | null
  commits: number
  additions: number
  deletions: number
}

export type GitHubState = {
  account: string | null
  token: string | null
  teammateApproves: boolean
  pullRequests: PullRequest[]
}

export type GitHubSeed = {
  signedIn?: boolean
  teammateApproves?: boolean
}

export const PRACTICE_ACCOUNT = 'your-username'
export const TEAMMATE_LOGIN = 'sam-rivera'

const SEEDED_TOKEN = 'ghp_practicetoken123'

export function createGitHubState(seed: GitHubSeed = {}): GitHubState {
  return {
    account: seed.signedIn ? PRACTICE_ACCOUNT : null,
    token: seed.signedIn ? SEEDED_TOKEN : null,
    teammateApproves: seed.teammateApproves ?? false,
    pullRequests: [],
  }
}
