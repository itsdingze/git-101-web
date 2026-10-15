import type { Sandbox } from '@/lib/git-sim/createSandbox'

export async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}
