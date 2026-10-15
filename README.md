# Git 101 Web

An interactive web app for learning Git through hands-on lessons. Work through bite-sized exercises covering everything from basic commits to branching, merging, and beyond, with a practice terminal that runs in the browser.

## Try It Out

**Live site:** [https://itsdingze.github.io/git-101-web/](https://itsdingze.github.io/git-101-web/)

Or run it locally:

```bash
git clone https://github.com/itsdingze/git-101-web.git
cd git-101-web
npm install
npm run dev
```

Before you push, run the same checks as CI:

```bash
npm run type-check
npm run lint
npm test
```

## Writing Lessons

Each lesson is a Markdown file in `src/data/lessons/`. A Vite plugin in `src/lib/lesson-markdown/` parses and validates them at build time, so a broken lesson fails the build with its file and line.

## Tech Stack

React + TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, and dnd-kit. The practice terminal runs a Git simulator built on isomorphic-git.

## License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
