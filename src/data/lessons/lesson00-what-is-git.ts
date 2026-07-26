import type { Lesson } from '@/types'

export default {
  id: 0,
  title: 'What is Git?',
  description: 'Understand version control and why Git matters',
  steps: [
    {
      type: 'reading',
      id: 'what-is-version-control',
      title: 'What is Version Control?',
      content: [
        {
          type: 'text',
          value:
            "Imagine you're writing a paper and you save it as `essay_final.doc`, then `essay_final_v2.doc`, then `essay_REALLY_final.doc`. That's version control — the hard way. A **version control system (VCS)** does this for you automatically: it records every change you make, so you can always go back to any previous version.",
        },
        {
          type: 'text',
          value:
            'Think of it like a save system in a video game. You can save your progress at any point, try something risky, and reload an earlier save if things go wrong. Version control gives developers this same superpower — but for code.',
        },
        {
          type: 'text',
          value:
            'Without version control:\n- You lose track of what changed and when.\n- Collaborating with others means emailing files back and forth.\n- One mistake can wipe out hours of work with no way to recover.\n\nWith version control, every change is tracked, reversible, and shareable.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'story-of-git',
      title: 'The Story of Git',
      content: [
        {
          type: 'text',
          value:
            'Git was created by **Linus Torvalds** in 2005 — the same person who created Linux. The Linux kernel had thousands of contributors worldwide, and the tool they were using to manage their code (BitKeeper) revoked its free license. Linus needed a replacement fast.',
        },
        {
          type: 'text',
          value:
            "He built Git in about two weeks, designing it to be fast, distributed, and able to handle massive projects. \"Git\" is British slang for an unpleasant person — Linus joked that he names all his projects after himself.",
        },
        {
          type: 'text',
          value:
            "Today, Git is the most widely used version control system in the world. It powers platforms like [GitHub](https://github.com), [GitLab](https://gitlab.com), and [Bitbucket](https://bitbucket.org), and nearly every software team uses it — from startups to Google, Microsoft, and Meta.",
        },
      ],
    },
    {
      type: 'reading',
      id: 'what-youll-learn',
      title: "What You'll Learn",
      content: [
        {
          type: 'text',
          value:
            'This course will take you from zero to confident with Git. Here is the roadmap:',
        },
        {
          type: 'text',
          value:
            "1. **Setting up Git** — Install Git and configure your identity.\n2. **Local basics** — Create repositories, make commits, and track changes.\n3. **Going remote** — Share your code on GitHub and collaborate with others.\n4. **Branching & merging** — Work on features in parallel and combine them.\n5. **Troubleshooting** — Fix mistakes, undo changes, and recover lost work.\n6. **Real-world workflow** — Pull requests, code review, and team conventions.",
        },
        {
          type: 'text',
          value:
            "Each lesson builds on the previous one, so it's best to go in order. By the end, you'll have the skills to use Git confidently in any project.",
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-version-control',
      question: 'What problem does version control solve?',
      options: [
        'Tracking changes over time so you can go back to any previous version',
        'Making your code run faster',
        'Automatically fixing bugs in your code',
        'Compiling code into an executable',
      ],
      correctIndex: 0,
      explanation:
        'Version control records every change to your project, so you can review history, undo mistakes, and collaborate without overwriting each other\'s work.',
    },
    {
      type: 'quiz',
      id: 'quiz-git-origin',
      question: 'Who created Git and why?',
      options: [
        'Linus Torvalds, to manage Linux kernel development after losing access to BitKeeper',
        'Bill Gates, to manage Windows source code',
        'GitHub, to power their website',
        'Google, to organize their internal code',
      ],
      correctIndex: 0,
      explanation:
        'Linus Torvalds created Git in 2005 when the Linux kernel project lost free access to BitKeeper. He designed Git to be fast, distributed, and capable of handling thousands of contributors.',
    },
  ],
} satisfies Lesson
