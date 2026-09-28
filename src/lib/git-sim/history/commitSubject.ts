export function commitSubject(message: string): string {
  return message.split('\n')[0]?.trim() ?? ''
}
