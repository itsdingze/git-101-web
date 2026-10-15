type CommandQueue = {
  push: (command: () => Promise<void>) => void
  request: <T>(command: () => Promise<T>) => Promise<T | undefined>
  clear: () => void
  replace: (command: () => Promise<void>) => void
}

export function createCommandQueue(): CommandQueue {
  let tail: Promise<unknown> = Promise.resolve()
  let generation = 0

  const request = <T>(command: () => Promise<T>): Promise<T | undefined> => {
    const pushedIn = generation
    const answer = tail
      .then(() => (pushedIn === generation ? command() : undefined))
      .catch((error: unknown) => {
        console.error(error)
        return undefined
      })
    tail = answer
    return answer
  }

  const push = (command: () => Promise<void>) => {
    void request(command)
  }

  const clear = () => {
    generation += 1
  }

  return {
    push,
    request,
    clear,
    replace: (command) => {
      clear()
      push(command)
    },
  }
}
