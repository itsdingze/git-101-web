class LessonSyntaxError extends Error {
  constructor(file: string, line: number, message: string) {
    super(`${file}:${line}: ${message}`)
    this.name = 'LessonSyntaxError'
  }
}

export class LineReader {
  private index = 0

  constructor(
    private readonly lines: readonly string[],
    private readonly file: string,
  ) {}

  get done(): boolean {
    return this.index >= this.lines.length
  }

  get lineNumber(): number {
    return this.index + 1
  }

  peek(): string {
    return this.lines[this.index] ?? ''
  }

  next(): string {
    return this.lines[this.index++] ?? ''
  }

  skipBlankLines(): void {
    while (!this.done && this.peek().trim() === '') this.index++
  }

  error(message: string, line = this.lineNumber): LessonSyntaxError {
    return new LessonSyntaxError(this.file, line, message)
  }

  failingAt<T>(line: number, read: () => T, label?: string): T {
    try {
      return read()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw this.error(label ? `${label}: ${message}` : message, line)
    }
  }
}
