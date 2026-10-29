import type { UnsupportedSyntax } from './tokenize'

export function endsWithOperator(operator: string): string {
  return `A ${operator} at the end of a line tells a real terminal to wait for more. This practice terminal runs one line at a time, so put the next command on the same line.`
}

export function unsupportedSyntaxMessage(syntax: UnsupportedSyntax): string {
  switch (syntax.kind) {
    case 'pipe':
      return "Pipes (|) aren't available in this practice terminal. Run each command on its own line."
    case 'variable':
      return `Variables like ${syntax.name} aren't available in this practice terminal.`
    case 'command-substitution':
      return "Running a command inside another with $(...) isn't available in this practice terminal. Run each command on its own line."
    case 'backtick':
      return "Backticks (`) run a command inside another in a real terminal, and this practice terminal doesn't do that. To type a backtick as text, put it inside single quotes."
  }
}
