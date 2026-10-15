import { describe, expect, it, vi } from 'vitest'
import { createCommandQueue } from './commandQueue'

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = () => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('createCommandQueue requests', () => {
  it('answers a request with the value its command produced', async () => {
    const queue = createCommandQueue()

    await expect(queue.request(() => Promise.resolve('main'))).resolves.toBe('main')
  })

  it('answers a request with nothing when Start over clears it before it runs', async () => {
    const queue = createCommandQueue()
    const firstRun = deferred()
    queue.push(() => firstRun.promise)
    const answer = queue.request(() => Promise.resolve('stale'))

    queue.replace(() => Promise.resolve())
    firstRun.resolve()

    await expect(answer).resolves.toBeUndefined()
  })

  it('answers a failed request with nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const queue = createCommandQueue()

    await expect(queue.request(() => Promise.reject(new Error('boom')))).resolves.toBeUndefined()
  })
})

describe('createCommandQueue', () => {
  it('runs a command entered mid-run only after the running one finishes', async () => {
    const queue = createCommandQueue()
    const firstRun = deferred()
    const log: string[] = []

    queue.push(async () => {
      log.push('first started')
      await firstRun.promise
      log.push('first finished')
    })
    queue.push(() => {
      log.push('second started')
      return Promise.resolve()
    })
    await settle()

    expect(log).toEqual(['first started'])

    firstRun.resolve()
    await settle()

    expect(log).toEqual(['first started', 'first finished', 'second started'])
  })

  it('reports a failed command and keeps going', async () => {
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
    const queue = createCommandQueue()
    const log: string[] = []

    queue.push(() => Promise.reject(new Error('boom')))
    queue.push(() => {
      log.push('second ran')
      return Promise.resolve()
    })
    await settle()

    expect(log).toEqual(['second ran'])
    expect(reported).toHaveBeenCalledWith(new Error('boom'))
    reported.mockRestore()
  })

  it('drops commands still waiting when cleared, but runs ones pushed afterwards', async () => {
    const queue = createCommandQueue()
    const firstRun = deferred()
    const log: string[] = []

    queue.push(() => firstRun.promise)
    queue.push(() => {
      log.push('dropped')
      return Promise.resolve()
    })
    queue.clear()
    queue.push(() => {
      log.push('after clear')
      return Promise.resolve()
    })
    firstRun.resolve()
    await settle()

    expect(log).toEqual(['after clear'])
  })

  it('runs only the replacement once the running command finishes, dropping the rest', async () => {
    const queue = createCommandQueue()
    const firstRun = deferred()
    const log: string[] = []

    queue.push(async () => {
      await firstRun.promise
      log.push('running finished')
    })
    await settle()
    queue.push(() => {
      log.push('dropped')
      return Promise.resolve()
    })
    queue.replace(() => {
      log.push('replacement')
      return Promise.resolve()
    })
    firstRun.resolve()
    await settle()

    expect(log).toEqual(['running finished', 'replacement'])
  })
})
