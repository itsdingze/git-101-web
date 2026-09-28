# Voice Spec

The first two lessons, What Is Git and Terminal Basics, are the reference for this spec. When a rule here is unclear, do what they do.

## Audience

Complete beginners. Many have never opened a terminal and don't know what a path, a prompt, or a file extension is. Some arrive from AI coding tools rather than a programming course. They may be learning any language, so nothing assumes Python, Java, or the web.

They learn in short sessions, alternating between a reading screen and hands-on practice, the way a language app works. Write for the reader who knows the least: if a word, symbol, or abbreviation could stop them, explain it.

## Course setting

- What Is Git teaches ideas only, with no terminal. Terminal Basics teaches the terminal itself. Git commands start in Tell Git Who You Are.
- One project runs through every lesson: `todo-app`, a small to-do list app the learner builds up lesson by lesson. Every sandbox starts in `~/todo-app`, and its prompt reads `~/todo-app $`.
- Code files end in `.txt` and hold short, language-neutral lines that read as plain programming: `MAX_TASKS = 10`, `show(tasks)`. Keep each edit to one line the learner can write with `echo`.
- Other files: `README.md` for docs, `.env` for secrets, and the shared clutter every language has (`*.log`, `build/`, `.DS_Store`).
- Commit messages follow Conventional Commits with three types: `feat:` (new feature), `fix:` (bug fix), `docs:` (README and notes), then an imperative summary: `feat: add due dates`. A fourth, `chore:`, appears only for housekeeping like `.gitignore` changes, and the lesson that first uses it says what it means. Merge commits keep a plain `Merge <branch>` message.
- AI comes up lightly: the learner may let an AI write things like a `.gitignore`, but the course teaches the rule underneath (never commit secrets or junk files). Never name an AI product.

## How much to explain

Explain more than feels necessary. A beginner who hits one unknown word stops understanding the rest of the screen.

- **Define before use.** Explain every new term where it first appears, and never use it earlier. A hint that says "when the prompt shows" needs "prompt" defined on a screen before it.
- **Spell out names.** Say what an abbreviation stands for: `pwd` (print working directory), `ls` (list), `cd` (change directory). A name that means something is easier to remember.
- **Explain every symbol.** `~`, `/`, `..`, `$`, and `>` each get a plain-words meaning. A symbol with two jobs gets each job explained separately: `/` between names means "go inside", and `/` at the start means the root.
- **Show the output.** Every command comes with what it prints. Readers can't picture output they've never seen.
- **Why before how.** Open each screen with why the reader needs it: why type commands instead of clicking buttons, why write files with `echo` when you'd normally use an editor.
- **Use everyday pictures.** Ground each abstract idea in something familiar: save points in a video game for commits, standing in one room of a house for the current folder, an address that gets more specific for a path. One picture per idea, used the same way each time it comes back.
- **Answer the next question.** When the reader is about to wonder something, ask it and answer it: "How can you tell which are files?" A short story behind a confusing name is fine when it makes the name stick, like why folders are also called directories.
- **Stay accurate.** Simplify, but never say something false. Prefer "usually" plus the real exception (`.git` is a folder with a dot) over a neat rule that breaks. Never use the wrong name to make something simpler: `~` is the home folder, not the root.
- **Name platform differences that will bite.** One line per platform: a Mac shows `%` instead of `$`, Windows learners use Git Bash rather than PowerShell.
- **Correct misconceptions out loud, then test them.** Saving isn't committing. Git isn't GitHub. Each gets a callout or a screen, and a quiz.
- **Skip what the reader never meets.** No internals, hash maths, permission codes, plumbing, or syntax the course never uses again.

## Voice

- Coaching: talk to one learner as "you". Start from a situation they recognise ("Your app worked an hour ago"), then give the idea or command.
- Plain everyday English. No idioms a non-native reader might trip on ("let it loose", "doesn't come into it").
- Concrete: real file names, real output, one example rather than a general rule.
- One idea per screen. When a screen grows past its budget, split it into two screens rather than cutting the explanation.
- Reassure by explaining, not by cheering. The reader feels safe when they know what a command does.
- Never salesy or cute: no hype, no "magic", no exclamation spam.
- Never AI-flavoured: no not-X-but-Y contrasts, one-line closers, forced triples, dashes, or decorative bold (see the `humanizer` skill).

## Tone by situation

| Situation | What changes |
|---|---|
| Default reading | Warm, plain, second person |
| Warning (can lose work) | Direct: the consequence first, with the exact case it applies to ("If a file named `plan.txt` already exists in the folder you're in"), then the safe move |
| Recap | Short and verb-first; one upbeat line is fine |

## Mechanics

- Contractions: always (you'll, don't, it's).
- Spelling: British (practise, memorising, initialise).
- Exclamation points: at most one per lesson, only in the recap.
- Capitalization: reading titles in sentence case, 5 words or fewer. A question title is fine ("Where am I?").
- Bold: each new term once, where it's defined. Also the names being compared in a comparison list (**Git**, **GitHub**; **Mac**, **Windows**, **Linux**). Nothing else.
- Dashes: no em or en dashes in prose. Semicolons rare.
- Oxford comma: yes.
- Code: commands, symbols, paths, file names, and output always in `code`.
- Address: "you". "Let's" only to open an example ("Let's see two commands and what they print."). "We" only for the course's own choices ("why we learn Git by typing commands"), never for what the reader does.

## Code examples

- **Transcripts in `bash` blocks.** When a command's output matters, write the block as a session: command lines start with the prompt, including the current folder (`~/todo-app $ pwd`), and output lines have none. The prompt changes as the learner moves (`~/todo-app/notes $`).
- **Explain inline.** Put the explanation of a line in a `#` note at the end of that line, not in a paragraph under the block. Notes show dimmed and are never copied. Keep each note to 12 words or fewer.
- **Build up.** Show the simple form before the full one: `echo "Add search"` on one line, then `echo "Add search" > plan.txt` on the next.
- **Match the sandbox.** Paths, spacing, and messages are exactly what the simulator prints (`/home/user/todo-app`, `app.txt  notes  README.md`). Run the commands in a sandbox to check.
- **Command lists without prompts.** Blocks of commands to copy, like the recap, have no prompt and no output.
- **Placeholders.** Use Git's own style, `<file>`, `<folder>`, `<branch>`, `<url>`, `<hash>`, and `"..."` for text in quotes. Start a Repository explains them where Git's hints first show `<file>`.

## Structure budgets (reading steps)

- Body prose: 150 words or fewer per step. Code blocks and callouts don't count. With tabs, count each tab. If a step needs more, split it.
- Paragraphs: 3 sentences at most. Three or more parallel facts (the rules for reading a path, one line per platform) go in a list.
- Order: why or the situation, then the example, then what it shows, then at most one gotcha.
- Callouts: the fact a learner must remember from a screen goes in a callout, never buried in body text. One fact per callout, 3 sentences or fewer, with a title of 6 words or fewer in sentence case. At most two per step. Background, like the story behind a name, goes in body prose.
  - `danger`: irreversible loss or a security risk (leaked secrets, `reset --hard`).
  - `warning`: a trap that loses work or causes a confusing failure (`>` is destructive, merging in the wrong direction).
  - `info`: a key idea or a common misconception (saving isn't a commit, folder or directory).
  - `tip`: a habit or shortcut that saves real time (the up arrow, `git status` when unsure, checking a setup step worked).
- Cut: side trips and alternative syntax the course never uses again, anything the next exercise prompt already says, and optional deep dives unless a later exercise needs them.
- Recap (`id: 'recap'`): "You can now:", a list of 3 to 5 verb-first skills of 10 words or fewer, a bash block of the lesson's commands with `#` notes of 6 words or fewer, and one line teasing the next lesson. A lesson with no commands has no bash block.
- Lesson references: never by number, because lessons move. Say "later", "earlier", or the lesson title.

## Structure budgets (exercises)

Feedback is short, the way a language app gives it. The practice does the teaching, so exercise text only points.

- Quiz: test the lesson's key idea or misconception, not trivia. Set it in a situation ("You're on a plane with no internet"). Wrong options are the mistakes beginners really make.
- Quiz question: 30 words or fewer.
- Quiz option: 10 words or fewer. The right answer is never the longest (a test checks).
- `whyWrong`: 2 sentences at most, 25 words or fewer, about that option only.
- `explanation`: 2 sentences at most, 20 words or fewer. Don't repeat a `whyWrong` or a callout word for word.
- Block exercise `prompt`: one sentence. Each `decoyReasons` and `missingReasons` entry: one sentence.
- Sandbox `brief`: 50 words or fewer. Say where the learner is and what the goal is.
- Goal `narration`: 40 words or fewer.
- Hints: up to 3, one sentence each. Point at what the learner can already read (the prompt, `pwd`) before giving the answer. The last one gives the exact command.
- Detour `message`: 40 words or fewer. What happened, then the fix.
- `completionMessage`: 2 sentences at most. Name what the learner did, not a lecture.

## Writing process

1. **Start from the reader's problem.** What goes wrong for them without this lesson? Open with that.
2. **Draft one screen per idea**, each opening with why it matters.
3. **Do a beginner read-through.** Read every sentence as someone who has never used a terminal. Mark every word, symbol, abbreviation, and idiom they might not know. Each one is defined at or before its first use, or replaced.
4. **Check the examples.** Run every command in a sandbox and copy the real output.
5. **Fact-check the simplifications.** Look for rules that need "usually", pictures that mislead, and names used loosely.
6. **Do a plain-English pass.** Fix grammar, replace idioms, cut filler, and make sure no sentence repeats a callout.
7. **Check the budgets**, then run `npm test`.

## Lexicon

- recorded snapshot of the project -> commit. "Save point" is the picture for a commit, used when introducing it and when calling back to it. Banned: checkpoint, and "save" as a verb for committing, since saving means writing a file to disk. "Snapshot" only when first defining commit.
- choosing what goes into the next commit -> stage, staging area (banned: index, cache)
- your files as they are now, in the three-places model -> working directory (matches the diagram label)
- a folder on the computer -> folder. "Directory" only when explaining the word, or inside a command's name (`pwd`, `cd`).
- the folder that holds the project -> project folder
- where a folder or file sits, like `~/todo-app/notes` -> path
- `~` -> your home folder (`/home/user` in the sandbox); `/` at the start of a path -> the root
- the text before the cursor, like `~/todo-app $` -> prompt
- Git's stored history -> repository (banned: repo)
- starting a command -> run (banned: execute)
- the window you type commands into -> terminal (banned: command line, console)
- the program inside the terminal that runs your commands -> shell. Introduced in Terminal Basics; say "terminal" everywhere else.
- GitHub proposal to merge -> pull request (banned: PR, merge request)
- a copy of the repository somewhere else -> remote; the default one -> `origin`

## Approved examples

- `reading.situation`: "Your app worked an hour ago. Since then you've changed a few files, and now it won't even start."
- `reading.picture`: "Think of save points in a video game. Before a hard level, you save. If it goes badly, you load that save and try again."
- `reading.nextQuestion`: "How can you tell which are files? A name with a dot and an ending, like `README.md` or `app.txt`, is usually a file."
- `reading.transcript`: "`~/todo-app $ pwd             # print working directory: which folder am I in?`"
- `reading.staging.body`: "Changed five files but only two are done? Stage just those two:"
- `reading.warning.redirect`: "If a file named `plan.txt` already exists in the folder you're in, `>` erases everything in it and writes only your new line."
- `reading.warning.resetHard`: "`git reset --hard` deletes uncommitted work for good. Commit or stash first."
- `quiz.situation`: "You're on a plane with no internet. Can you still make commits?"
- `recap.skill`: "Undo a commit that's already pushed"
