---
id: 1
title: Terminal Basics
description: Why we type commands, and the few you need to get around
unlocks: []
---

## How you'll learn Git {#why-the-terminal}

In this course, you'll learn Git by typing its commands yourself, instead of clicking buttons in an app. It might feel old-fashioned at first, but it's the quickest way to really understand Git.

Code editors like VS Code do have Git buttons, but every one of them is a shortcut. When you click "Commit", the app runs a Git command for you behind the scenes. Once you know the commands, you'll understand every Git button in every app, instead of memorising one app's menus.

The commands also last. Apps move their buttons around with every redesign, but Git's core commands have barely changed in twenty years.

And commands are what everyone else speaks. Git's own messages, answers you find online, and AI coding tools all talk in commands. When an AI tool says it ran `git reset --hard`, you'll know whether to worry.

> [!TIP] You only need a handful
> Getting around in a terminal takes five commands, and this lesson teaches all of them.

## Meet the terminal {#terminal-basics}

A **terminal** is a window where you type commands instead of clicking. You type a command, press Enter, and the terminal prints its answer.

The program inside the terminal that reads and runs your commands is called the **shell**. There are a few different shells, and their commands differ a little from one to the next. This course uses **bash**, the shell most Git guides use:

- **Mac** comes with a shell called zsh, which runs every command in this course just like bash does.
- **Windows** comes with PowerShell. Some of its commands share names with bash's but behave differently. When you set up your own computer near the end of the course, you'll install Git Bash, which is bash for Windows.
- **Linux** usually comes with bash already.

## Your project {#your-project}

Through this whole course you'll build one small project: a to-do list app. It lives in a folder called `todo-app`, and everything you practise happens there.

The project is only just starting. So far the folder holds two things:

- `README.md`, a file that says what the project is. Right now it's one line, the app's name.
- `notes`, a folder with a file of your ideas for the app.

There's no app yet. You'll write its first lines at the end of this lesson, and add to it in every lesson after.

## Where am I? {#where-am-i}

The terminal always stands in one folder, the way you stand in one room of a house. Every command you type acts on the room you're in.

You'll also hear folders called **directories**. Terminals came first, and back then a folder was just a list of the file names inside it, like a phone directory lists names. In the 1980s, computers got desktops with icons, and designers drew each one as a paper folder from an office desk.

> [!INFO] Folder or directory?
> They're the same thing. Programmers still say "directory" out of habit, and so do command names like `pwd`. This course says "folder".

## The prompt {#the-prompt}

The terminal shows which folder you're in at the start of the line you type on, like `~/todo-app $`. That bit is called the **prompt**.

The symbol at the end means "ready for your command", and you type after it. Here it's `$`, but each shell picks its own symbol, so you might see `%` on a Mac or `>` in PowerShell. They all mean the same thing.

Your own terminal might also show a little more before it, like your username and your computer's name.

## Read a path {#read-a-path}

The folder part of the prompt, like `~/todo-app`, is called a **path**. Read it from left to right, like an address that gets more specific:

- A `/` between two names means "go inside", so `todo-app/notes` is the `notes` folder inside `todo-app`.
- A `/` at the very start means the top folder of the computer, the one that holds everything else. It's called the **root**, so `/home/user` starts at the root and goes inside `home`, then `user`.
- `~` is short for your home folder, which is `/home/user` in this course. On your own computer it's `/Users/yourname` on a Mac, `/home/yourname` on Linux, or `/c/Users/yourname` in Git Bash on Windows.
- So `~/todo-app` is the `todo-app` folder inside your home folder.

## Look around {#look-around}

Let's see two commands and what they print. Lines without a `$` are the terminal's answer:

```bash
~/todo-app $ pwd             # print working directory: which folder am I in?
/home/user/todo-app          # the full path, with ~ spelled out as /home/user
~/todo-app $ ls              # list: what's in this folder?
notes  README.md             # a folder and a file
```

How can you tell which is the file? A name with a dot and an ending, like `README.md`, is usually a file. The ending is called a **file extension**, and it says what kind of file it is: `.md` is Markdown, a simple format for notes and docs, and `.txt` is plain text. A name with no ending, like `notes`, is usually a folder.

That's a naming habit, not a rule. Later you'll meet `.git`, a folder whose name starts with a dot.

## Move between folders {#moving-around}

`cd` walks you into another folder, and `cd ..` walks you back out:

```bash
~/todo-app $ cd notes          # change directory: step into notes
~/todo-app/notes $ pwd         # the prompt shows the new folder, and pwd confirms it
/home/user/todo-app/notes
~/todo-app/notes $ ls          # what's in here?
ideas.txt                      # your ideas for the app
~/todo-app/notes $ cd ..       # two dots always mean one folder up
~/todo-app $                   # back in todo-app
```

> [!TIP] Reuse your last command
> The up arrow brings back your last command, ready to edit or run again.

```quiz
id: quiz-cd-up
question: "`pwd` shows `/home/user/todo-app/notes`. You run `cd ..`. Where are you now?"
options:
  - text: "`/home/user/todo-app`"
  - text: "`/home/user`"
    whyWrong: "`cd ..` climbs one level only, from `notes` up to `todo-app`."
  - text: The root folder, `/`, at the very top
    whyWrong: "`..` climbs one folder, not all the way to the top."
correctIndex: 0
explanation: "`..` is the folder above the one you're in, so you're back in `todo-app`."
```

## Read and write a file {#reading-writing-files}

Git's whole job is noticing when files change, so you'll change files a lot in this course. On your own projects you'd do that in your code editor. Here, two commands let you do it without leaving the terminal.

Time to start the app. Its code goes in a new file, `app.txt`. A block with no prompt, like this one, is a list of commands to type, one per line:

```bash
cat README.md                     # print what's in a file
echo "tasks = load()"             # echo repeats your text back onto the screen
echo "tasks = load()" > app.txt   # > sends it into app.txt instead, creating the file if it's new
echo "show(tasks)" >> app.txt     # >> adds it to the end of app.txt, keeping what's already there
```

Those two lines are the whole app so far: load the tasks, then show them. A real app is written in a programming language. This one is written as plain steps, so you can follow it without knowing one.

> [!WARNING] `>` is destructive
> If a file named `app.txt` already exists in the folder you're in, `>` erases everything in it and writes only your new line. The old contents are gone for good, unless you'd saved them in a commit. To add a line and keep the rest, use `>>`.

```quiz
id: quiz-redirect
question: >-
  `app.txt` holds two lines. You run `echo "show(tasks)" > app.txt`. What's in it now?
options:
  - text: Only the line `show(tasks)`
  - text: The two old lines, then `show(tasks)`
    whyWrong: A single `>` replaces the file. Adding to the end takes `>>`.
  - text: An error, because the file already exists
    whyWrong: The `>` never refuses. It silently replaces whatever was there.
  - text: The old lines, until you save the file
    whyWrong: The terminal writes the file straight away, with no separate save.
correctIndex: 0
explanation: One `>` replaces everything in the file with your new line.
```

```sandbox-exercise
id: find-your-feet
title: "Practice: find your way around"
mode: guided
brief: This is `todo-app`, the to-do list app you'll build through the whole course. So far it holds `README.md` and your `notes` folder. It's an ordinary folder, and Git isn't watching it yet. Type `help` any time to see the commands you know so far.
seed:
  dir: todo-app
  setup:
    - story: start
goals:
  - id: app-started
    label: "`app.txt` sits at the top of `todo-app`"
    narration: >-
      Look around with `pwd` and `ls`. Step into `notes` with `cd notes`, and read your ideas with `cat ideas.txt`. Then climb back out with `cd ..` and start the app with `echo "tasks = load()" > app.txt`.
    hints:
      - Look at the path before the `$`, or run `pwd`, to see which folder you're in.
      - If the path ends in `/notes`, run `cd ..` to climb back up.
      - When the prompt shows `~/todo-app $`, run `echo "tasks = load()" > app.txt`.
    check:
      kind: file-present
      path: app.txt
  - id: app-extended
    label: "`app.txt` holds the app's two lines"
    narration: >-
      Add the app's second line with `echo "show(tasks)" >> app.txt`, then read the file back with `cat app.txt`.
    hints:
      - Two arrows, `>>`, add a line to the end. One `>` would replace the line you wrote.
      - Run `echo "show(tasks)" >> app.txt`, then `cat app.txt`.
    check:
      kind: file-line-count
      path: app.txt
      atLeast: 2
detours:
  - id: app-in-notes
    check:
      kind: all-of
      checks:
        - kind: file-present
          path: notes/app.txt
        - kind: not
          check:
            kind: file-present
            path: app.txt
    message: >-
      `app.txt` landed inside `notes`, because that's where you were standing. Run `cd ..`, write it again, and delete the stray one with `rm notes/app.txt`, where `rm` means remove.
completionMessage: You moved around, read a file, and wrote the first two lines of your app. That's all the terminal you need for Git.
```

## Recap {#recap}

You can now:

- Say why we learn Git by typing commands
- Read a path like `~/todo-app/notes`
- Find which folder you're in and what's inside
- Move into a folder and back out
- Read a file and write a short one

```bash
pwd                       # which folder am I in
ls                        # what's in this folder
cd notes                  # go into a folder
cd ..                     # go back up one folder
cat app.txt               # print a file
echo "text" > app.txt     # write a line into a file, replacing what was there
echo "text" >> app.txt    # add a line to the end of a file
```

Next up: you tell Git who you are.
