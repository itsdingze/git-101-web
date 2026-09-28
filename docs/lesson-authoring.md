# Lesson authoring guide

Every lesson is one Markdown file in `src/data/lessons/`. A Vite plugin turns it into a `Lesson` object at build time, so there is no CMS to run: edit the file, save, and the dev server reloads.

Write the words by the voice spec in `docs/voice-spec.md`. This guide covers structure only.

## Contents

- [The file](#the-file)
- [Reading steps](#reading-steps)
- [Content blocks](#content-blocks)
- [Exercises](#exercises)
- [Sandbox exercises](#sandbox-exercises)
- [Checking your work](#checking-your-work)

## The file

````md
---
id: 3
title: Your First Commit
description: Stage files, write good commit messages, and view history
unlocks: [ add, commit, diff, log ]
---

## Staging files {#staging-files}

Changed five files but only two are done? You can commit just those two.

```block-exercise
id: build-add
prompt: Build the command that stages everything in this folder
availableBlocks: [ git, add, commit, . ]
correctAnswer: [ git, add, . ]
```
````

The file has two parts:

1. **Frontmatter** between the `---` lines, in YAML.
2. **Steps**, in the order learners see them. A `## Heading {#id}` starts a reading step. A fenced block named after an exercise type (` ```quiz `, ` ```block-exercise `, ` ```conflict-exercise `, ` ```sandbox-exercise `) is an exercise step.

| Frontmatter field | What it is |
|---|---|
| `id` | The lesson number, starting at 0, used in URLs (`/lesson/3`). |
| `title` | Shown on the home page and in the lesson header. |
| `description` | One line under the title on the home page. |
| `unlocks` | Git commands the sandbox allows from this lesson on. Each simulated command is unlocked in exactly one lesson. |

### Adding a lesson

1. Create `src/data/lessons/lessonNN-short-name.md`.
2. Import it in `src/data/lessons/index.ts` and add it to the `lessons` list, in order.
3. Move any command it teaches out of a later lesson's `unlocks` into this one.
4. End it with a `recap` step (see below) and add its commands to `src/data/cheatsheet.ts`.

## Reading steps

```md
## Git's three places {#three-areas visualization=three-place-model}
```

The heading text is the step title. Inside the braces:

| Attribute | Required | Values |
|---|---|---|
| `#id` | yes | Unique within the lesson, kebab-case. Saved progress refers to it. |
| `visualization=` | no | `three-place-model`, `git-graph`, `conflict-markers`, `diff-walkthrough`, `reset-walkthrough`, `restore-walkthrough` |
| `variant=` | no | For `git-graph` only: `branching` or `merging` |

A step with a visualization shows an "Interactive diagram below" link and the diagram after its text.

Everything under the heading, up to the next heading or exercise block, is that step's content.

### The recap step

The last step of every lesson has the id `recap`. The summary page reads it:

````md
## Recap {#recap}

You can now:

- Stage the files for your next commit
- Commit with a message that says what changed

```bash
git add .             # stage everything in this folder
git commit -m "..."   # commit with a message
```

Next up: keeping passwords out of your history.
````

- The first list becomes the skills list on the summary page.
- Every `bash` block becomes the command list. Only use commands unlocked by this lesson or earlier; a test checks.

## Content blocks

Separate blocks with a blank line.

### Paragraphs

Plain text. Inside any text you can use `**bold**`, `*italic*`, `` `code` ``, and `[links](https://example.com)`.

Write each paragraph on one line. A line break inside a paragraph shows as a line break on the page.

### Lists

```md
- A bulleted item
- Another item

1. A numbered item
2. Another item
```

Keep each item on one line. To continue an item on the next line, indent that line by two spaces.

### Code

````md
```bash
git status    # a note after # shows muted and lined up
```

```text
On branch main
nothing to commit, working tree clean
```
````

Use `bash` for commands the learner types, and `text` for what Git prints back. In `bash` blocks, `# notes` are dimmed and can't be selected, so copying a command never copies the note.

To show a command together with its output, write a transcript in a `bash` block, so each line can carry a note:

````md
```bash
~/todo-app $ cd notes          # change directory: step into notes
~/todo-app/notes $ pwd         # the prompt shows the new folder
/home/user/todo-app/notes
```
````

Command lines start with the sandbox prompt, folder included. Output lines have no prompt. Notes line up on their own when the code before them is 40 characters or fewer. The voice spec covers when to use a transcript.

### Callouts

```md
> [!WARNING] Keep the quotes
> A name with a space needs quotes.
```

The title after `]` is optional. Every line of the body starts with `> `.

| Tag | Colour | Use it for |
|---|---|---|
| `[!DANGER]` | red | Irreversible loss or a security risk |
| `[!WARNING]` | orange | A trap that loses work or causes a confusing failure |
| `[!INFO]` | blue | A key idea or a common misconception |
| `[!TIP]` | green | A habit or shortcut that saves time |

The fact a learner must remember from a screen goes in a callout. At most two per step.

### Tabs

```md
:::tabs os
::tab Windows
Open **Git Bash** from the Start menu.

::tab Mac
Press Cmd+Space and type `Terminal`.

::tab Linux
Open your Terminal app.
:::
```

- `:::tabs <group>` opens the tabs and `:::` closes them.
- Each `::tab <Label>` starts a tab. A tab holds paragraphs, lists, code, and callouts, but not more tabs.
- Tabs that share a group remember the learner's choice across the whole course. Use `os` for Windows/Mac/Linux; a tab labelled `Windows` or `Mac` is picked automatically on that computer.

## Exercises

An exercise is a fenced block named after its type, with YAML inside. Wrap a string in double quotes when it contains `: ` or starts with a backtick, quote, or bracket. Strings that span lines use `|`.

### Quiz

```yaml
id: quiz-staging
question: What order do you run things in?
options:
  - text: git add . → git init → git commit
    whyWrong: "`git add` only works inside a repository."
  - text: git init → git add . → git commit
correctIndex: 1
explanation: Initialise first, then stage, then commit.
```

| Field | Required | What it is |
|---|---|---|
| `options` | yes, 2 or more | `text` is the answer shown. `whyWrong` is the feedback when a learner picks it. |
| `correctIndex` | yes | Which option is right, counting from 0. The page shuffles the options. |
| `explanation` | yes | Shown after the right answer. |

A test checks that the right answer isn't given away by being the longest.

### Block exercise

The learner builds a command from word tiles.

```yaml
id: build-add
prompt: Build the command that stages everything in this folder
availableBlocks: [ git, add, commit, ., -m, status ]
correctAnswer: [ git, add, . ]
acceptableAnswers:
  - [ git, add, -A ]
decoyReasons:
  commit: "`commit` records the snapshot. Staging comes first."
missingReasons:
  .: A dot means everything in this folder.
hints:
  - Start with "git add"
```

| Field | Required | What it is |
|---|---|---|
| `availableBlocks` | yes | Every tile shown, right ones and decoys. |
| `correctAnswer` | yes | The tiles in the right order. |
| `acceptableAnswers` | no | Other orders or tiles that are also right. |
| `decoyReasons` | no | Why each wrong tile doesn't belong, keyed by tile. A test requires one for every decoy. |
| `missingReasons` | no | What a missing tile does, keyed by tile. |
| `hints` | no | Revealed one at a time. |

### Conflict exercise

The learner edits a file that has merge conflict markers.

```yaml
id: resolve-conflict-1
prompt: Keep the wording from the feature branch.
fileName: welcome.txt
oursLabel: HEAD
theirsLabel: feature-banner
oursContent: Welcome back!
theirsContent: Welcome to our amazing newsletter!
surroundingBefore: |-
  # Newsletter
surroundingAfter: |-
  Thanks for reading.
acceptableResolutions:
  - Welcome to our amazing newsletter!
hints:
  - Delete the marker lines too.
```

The file shown is `surroundingBefore`, then the conflict built from the `ours` and `theirs` fields, then `surroundingAfter`. `acceptableResolutions` lists every text the conflicted section may end up as.

## Sandbox exercises

A real Git simulator the learner types into, with goals checked after every command.

```yaml
id: first-commit-loop
title: "Practice: your first commit"
mode: goal
brief: Get both files into a commit, then record a change on top of it.
seed:
  dir: my-story
  setup:
    - write:
        chapter-one.md: |
          The lighthouse had been dark for a year.
    - run: git init
goals:
  - id: committed
    label: Both files are in a commit
    narration: Stage both files, then commit them.
    check:
      kind: commit-exists
      containing: [ chapter-one.md ]
    hints:
      - Staging only picks what goes in.
detours:
  - id: nested-repo
    check: { kind: repo-above-project }
    message: That `git init` ran one folder too high. Run `cd my-story` and try again.
completionMessage: That's the core loop of Git.
```

| Field | Required | What it is |
|---|---|---|
| `title`, `brief` | yes | Shown above the terminal. |
| `mode` | yes | `guided` shows one goal at a time, in order, with its `narration`. `goal` lists every goal at once, met in any order. |
| `seed` | yes | The starting state (below). |
| `goals` | yes | What the learner must do. The terminal prints a tick when each is met. |
| `detours` | no | Wrong paths. When a detour's check turns true, its `message` prints once as a warning. |
| `completionMessage` | no | Printed when every goal is met. |

### Seed

| Field | What it is |
|---|---|
| `dir` | The project folder the terminal starts in. `""` starts in the home folder, for a lesson that clones. |
| `identity` | `{ name, email }` to start with. Leave it out to use the name the learner set in Tell Git Who You Are. `{ name: '', email: '' }` starts with no identity at all and saves whatever the learner sets, as that lesson does. |
| `setup` | Steps run before the learner starts, in order: `run: <command>`, `write: { path: contents }`, or `remove: [paths]`. Add `at: remote` to run a step in the remote repository. |
| `remote` | `{ name, url }` for a remote repository. `cloned: false` means the local folder isn't a clone yet. `setup` prepares the remote before cloning, and `ahead` adds commits by a teammate after it. |

### Goal checks

A `check` has a `kind` and, for some kinds, more fields. Paths are relative to the project folder.

| Kind | Fields | True when |
|---|---|---|
| `repo-initialized` | | The project folder is a repository |
| `repo-above-project` | | The repository sits in the folder above the project, a mistake worth a detour |
| `files-staged` | `paths` | Every path is staged |
| `file-present` / `file-absent` | `path` | The file exists / doesn't |
| `file-line-count` | `path`, `atLeast` | The file holds at least that many lines, not counting empty ones |
| `file-tracked` / `file-untracked` / `file-ignored` | `path` | The file has that status |
| `working-tree-clean` | | Nothing to commit |
| `commit-exists` | `containing`, `modifies`, `onBranch`, `messageIncludes` (all optional) | Some commit matches every field given |
| `commit-count` | `count` | The local branches hold exactly that many commits |
| `head-message` | `includes` | The latest commit's message contains the text |
| `merge-commit-exists` | `onBranch` (optional) | A merge commit exists |
| `merge-in-progress` | | A merge is stopped on a conflict |
| `no-conflict-markers` | | No file holds conflict markers |
| `markers-committed` | | Conflict markers were committed by mistake |
| `branch-exists` / `branch-absent` | `name` | The branch exists / doesn't |
| `on-branch` | `name` | The learner is on that branch |
| `stash-count` | `count` | Exactly that many stashes |
| `stash-empty` | | No stashes |
| `config-set` | `key` | The setting has a value |
| `config-equals` | `key`, `value` | The setting has that value |
| `clone-exists` | `path` | A clone exists at the path |
| `pushed` | `branch` | The branch has nothing the remote lacks |
| `upstream-set` | `branch` | The branch tracks a remote branch |
| `up-to-date-with-remote` | `branch` | The branch matches the remote |
| `not` | `check` | The inner check is false |
| `all-of` / `any-of` | `checks` | Every / any inner check is true |

In `guided` mode a goal only counts once every goal before it is met. Goals latch: once met, they stay met.

## Checking your work

- **While editing:** the dev server shows the file, line, and problem when a lesson won't parse, for example `lesson03-first-commit.md:24: block-exercise "build-add": correctAnswer: expected array`. Misspelled field names are errors too.
- **Before you finish:** run `npm test`. The content tests replay every sandbox from its goals and hints, try common wrong paths, check that every decoy tile has a reason, that quiz answers are balanced, that recaps only list unlocked commands, and that every cheat sheet command appears in its lesson.
