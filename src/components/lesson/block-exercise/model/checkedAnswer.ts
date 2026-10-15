export type CheckedAnswer = {
  answer: readonly string[]
  feedback: string | null
}

export function answerKeyOf(answer: readonly string[]): string {
  return answer.join('\u0000')
}

export function changedAnswer(current: CheckedAnswer, answer: readonly string[]): CheckedAnswer {
  return answerKeyOf(answer) === answerKeyOf(current.answer) ? current : { answer, feedback: null }
}
