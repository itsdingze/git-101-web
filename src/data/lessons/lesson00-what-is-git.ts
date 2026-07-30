import type { Lesson } from '@/types'

export default {
  id: 0,
  title: 'What is Git?',
  description: 'Understand version control and why Git matters',
  steps: [
    {
      type: 'reading',
      id: 'what-is-version-control',
      title: 'What is version control?',
      content: [
        {
          type: 'text',
          value:
            "Imagine you're writing an essay. You save it as `essay_final.doc`, then `essay_final_v2.doc`, then `essay_REALLY_final.doc`. That is version control, done the painful way. A **version control system** is a program that does it for you: it records every version of your project, so you can look back at what changed and return to any earlier version.",
        },
        {
          type: 'text',
          value:
            'Think of a save system in a video game. You save your progress, try something risky, and reload an earlier save when it goes wrong. Version control gives you that same power over a real project.',
        },
        {
          type: 'text',
          value: 'Without version control:',
        },
        {
          type: 'list',
          items: [
            'You lose track of what changed, when, and why.',
            'Working with other people means emailing folders back and forth.',
            'One bad afternoon can wipe out work you have no way to recover.',
          ],
        },
        {
          type: 'text',
          value:
            'Git is the version control system this course teaches. The thing you record with it is called a **commit**. Each commit is a snapshot of your whole project at one moment, with a short note from you saying what changed. A project that Git is tracking is called a **repository**, or "repo" for short.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Two things a commit is not',
          value:
            "A commit is **not** the same as saving a file. Saving writes your file to disk, and Git ignores it until you ask for a commit. You will save a file twenty times and make one commit out of all of it.\n\nA commit also **does not send anything anywhere**. It is written to a hidden folder inside your own project, on your own computer. Nobody else can see it. Getting your work onto the internet is a separate step you take on purpose.",
        },
      ],
    },
    {
      type: 'reading',
      id: 'git-vs-github',
      title: 'Git vs GitHub',
      content: [
        {
          type: 'text',
          value:
            'These two get mixed up more than anything else in this course, so let us settle it now. They are separate things that happen to have confusingly similar names.',
        },
        {
          type: 'text',
          value:
            '**Git** is a program on your computer. It records the history of your project. It works with no internet connection at all.',
        },
        {
          type: 'text',
          value:
            '**GitHub** is a website. It stores a copy of that history online, so other people can see your project and so you still have your work if your laptop dies.',
        },
        {
          type: 'text',
          value:
            'Git is the camera and the photo album: it takes the snapshots and keeps them in order, in your hands. GitHub is the photo-sharing site where you upload the album so other people can look at it and so a copy exists somewhere that is not your bedroom.',
        },
        {
          type: 'text',
          value:
            "So the dependency only runs one way. GitHub needs Git, since it exists to host what Git produces. Git does not need GitHub. You can use Git for years, on every project you write, and never make an account. GitHub isn't the only site of its kind either. [GitLab](https://gitlab.com) and [Bitbucket](https://bitbucket.org) do the same job.",
        },
        {
          type: 'text',
          value:
            'Downloading Git needs the internet once, in the next lesson. After that, lessons 2 and 3 never need the internet again, even though you will be using Git the whole time.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'story-of-git',
      title: 'The story of Git',
      content: [
        {
          type: 'text',
          value:
            'Git was created by **Linus Torvalds** in 2005. He is also the person who started Linux, the operating system that runs most of the servers on the internet. Linux had thousands of contributors around the world, and they managed all that code with a tool called BitKeeper. Then BitMover, the company behind BitKeeper, withdrew the free version. Linus needed a replacement — fast.',
        },
        {
          type: 'text',
          value:
            'He built the first working version of Git in about two weeks. He designed it to be quick, to give every contributor a full copy of the history on their own machine, and to survive a project with thousands of people changing things at once.',
        },
        {
          type: 'text',
          value:
            '"Git" is British slang for an unpleasant, annoying person. Torvalds joked that he names all his projects after himself, and Linux was the first.',
        },
        {
          type: 'text',
          value:
            'Today Git is the version control system almost everyone uses, from a student with one file to Google, Microsoft, and Meta. Learning it once carries you through your whole career.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'what-youll-learn',
      title: "What you'll learn",
      content: [
        {
          type: 'text',
          value:
            'This course takes you from zero to comfortable. Here is the road ahead:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**Setting up Git** means installing it and telling it who you are.',
            '**Local basics** takes you through starting a repository, making commits, and seeing what changed.',
            '**Going remote** puts your project on GitHub so you can work with other people.',
            '**Branching and merging** lets you build two things at once, then combine them.',
            '**Fixing mistakes** undoes changes and recovers work you thought was gone.',
            '**Real-world workflow** covers pull requests, code review, and how teams actually work.',
          ],
        },
        {
          type: 'text',
          value:
            "Each lesson builds on the one before it, so go in order. Nothing here assumes you have written code before, and nothing you do in this app can break anything on your computer.",
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-version-control',
      question: 'What problem does a version control system solve?',
      options: [
        {
          text: 'It checks your code for mistakes before you run it.',
          whyWrong:
            'Git never reads or judges what is inside your files. It only records what they contained at each point in time. Whether the contents are any good is not a question it can answer.',
        },
        {
          text: 'It lets several people type into the same file at once, the way Google Docs does.',
          whyWrong:
            'Close, but Git does not sync live edits. Everyone works on their own copy, and Git helps you combine the changes afterwards.',
        },
        {
          text: 'It keeps every version of your project, so you can see what changed and go back to any earlier point.',
        },
        {
          text: 'It keeps one backup copy of your project in case your computer dies.',
          whyWrong:
            'A backup holds one copy: the newest one. Version control holds every version, each with a note on what changed and who changed it. You can go back to any of them, not only the last.',
        },
      ],
      correctIndex: 2,
      explanation:
        'The value is the history, not the copy. Because Git records what changed at each step and why, you can find the moment something broke and go back to the point right before it.',
    },
    {
      type: 'quiz',
      id: 'quiz-git-vs-github',
      question:
        'A classmate says "I saved my work to Git." What did they most likely actually do?',
      options: [
        {
          text: "Made a commit, recording a snapshot of their project in Git's history, on their own computer.",
        },
        {
          text: 'Uploaded their project to GitHub, so it is now visible online.',
          whyWrong:
            'That is a different step, on a different thing. Git runs on your computer. GitHub is a website. Recording a commit sends nothing anywhere.',
        },
        {
          text: 'Pressed Ctrl+S (or Cmd+S) in their editor to save the file.',
          whyWrong:
            'Saving writes the file to disk and Git does not react to it at all. After saving, Git still reports the file as changed and unrecorded until you make a commit.',
        },
        {
          text: 'Put the project in a folder that Git watches, so Git saves it automatically.',
          whyWrong:
            'Git never records anything on its own. Nothing enters the history until you ask for it, which is exactly what makes the history readable.',
        },
      ],
      correctIndex: 0,
      explanation:
        '"Saving to Git" almost always means committing, and committing is a local act. The work is safe in your project\'s history but still only on your machine. Sharing it is a separate decision you make later.',
    },
    {
      type: 'quiz',
      id: 'quiz-git-origin',
      question: 'Why did Linus Torvalds build Git in 2005?',
      options: [
        {
          text: 'He wanted a tool that merged everyone\'s changes automatically, with no conflicts ever.',
          whyWrong:
            'No tool can do that. When two people rewrite the same line, something has to choose. Git makes those clashes visible and helps you settle them, but it does not prevent them.',
        },
        {
          text: 'The Linux project lost free access to the tool it used to manage its code, and needed a replacement that could handle thousands of contributors.',
        },
        {
          text: 'He built it as the engine behind GitHub, which launched at the same time.',
          whyWrong:
            'GitHub came three years later, in 2008, and was built by other people on top of Git. Git worked fine before GitHub existed and still works without it.',
        },
        {
          text: 'Earlier tools had no way to back code up to a server on the internet.',
          whyWrong:
            'They could already do that. The point of Git was the opposite direction: give every contributor a complete copy of the history on their own machine, so nobody has to wait on a central server.',
        },
      ],
      correctIndex: 1,
      explanation:
        'The pressure was scale and independence. Thousands of people were changing the same enormous project, so Git was designed to be fast and to let everyone work from a full local copy.',
    },
    {
      type: 'reading',
      id: 'recap',
      title: 'Recap',
      content: [
        { type: 'text', value: 'You can now:' },
        {
          type: 'list',
          items: [
            'Say what a version control system does, and why it beats a folder full of `_final_v2` files',
            'Explain that a commit is a snapshot of your project, not the same thing as saving a file',
            'Tell Git and GitHub apart, and say which one needs the other',
            'Explain where Git came from and what problem it was built to solve',
          ],
        },
        {
          type: 'text',
          value:
            'Next up: you install Git on your own computer and tell it your name, so every commit you make from now on is stamped with who wrote it.',
        },
      ],
    },
  ],
} satisfies Lesson
