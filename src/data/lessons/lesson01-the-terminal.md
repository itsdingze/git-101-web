---
id: 1
title: The terminal
description: Run commands in a terminal and move between folders
unlocks: []
---

## Why use commands? {#why-commands}

In this course you'll learn Git's own commands, and you'll type them in a terminal.

Code editors and Git apps offer buttons for many of the same actions. Learning the commands helps you understand those actions and follow Git guides.

## Meet the terminal {#the-terminal}

A **terminal** is a window where you give your computer instructions by typing commands.

The program that reads and runs your commands is called a **shell**. This course uses a simulated terminal in your browser. It supports the commands taught here, and those commands do not change files on your computer.

Terminal examples show commands and their output. You'll type commands yourself in the sections marked **Practice**. Each practice starts with files and history prepared for that task. **Start over** returns that exercise to its starting state.

Later, you'll use the same commands in a terminal on your own computer.

## Where am I? {#where-am-i}

In the terminal, you work from one folder at a time, called the **current folder**. Think of it as the room you're standing in. When you ask the computer to list files, this is the folder you're asking about unless you name another one.

You may hear people call folders **directories**. The two words mean the same thing.

## The prompt {#the-prompt}

In this course, the terminal shows which folder you're in at the start of the line you type on, like `~ $`. That text is called the **prompt**. `cd` (change directory) moves to another folder, and the prompt changes with it:

```terminal
~ $ cd projects            # go into the projects folder
~/projects $               # the prompt shows the new folder
```

The `$` marks where you type a command.


## Read a path {#read-a-path}

A **path** tells you where a file or folder is. Read it from left to right, like an address that gets more specific:

- `~` is short for your home folder, the one that holds your own files. In this course it's `/home/user`.
- A `/` between two names means "go inside", so `projects/recipes` is the `recipes` folder inside `projects`.
- A `/` at the very start means the top folder of the computer, the one that holds everything else. It's called the **root**, so `/home/user` starts at the root and goes inside `home`, then `user`.

So a prompt of `~/projects/recipes $` means you're in `recipes`, inside `projects`, inside your home folder. `pwd` (print working directory) prints that path in full, starting at the root:

```terminal
~ $ cd projects/recipes            # go into projects, then recipes
~/projects/recipes $ pwd           # print the full path
/home/user/projects/recipes        # ~ spelled out as /home/user
~/projects/recipes $
```

## List files and folders {#look-around}

To see which folder you're in and what it contains, use `pwd` and `ls`. `ls` is short for list. Let's run both in your home folder:

```terminal
~ $ pwd                 # print working directory: where am I?
/home/user              # the full path, with ~ spelled out
~ $ ls                  # list: what's in this folder?
documents  projects
~ $
```

You can explore the same folder structure in the file explorer below.

```files ~
documents/
  letter.txt
projects/
  recipes/
    soup.txt
```

How can you tell which are files? In the file explorer, folders have a folder icon. In a list of names, like the output of `ls`, there's no icon. A name with a dot and an ending, like `letter.txt`, is usually a file. A name with no ending, like `projects`, is usually a folder.

The ending is called a **file extension**, and it says what kind of file it is. `.txt` is plain text. The dot rule is only a naming habit, though: later you'll meet `.git`, a folder whose name starts with a dot.

## Move between folders {#moving-around}

To move around, give `cd` the name of a folder. Two dots, `..`, mean its parent, the folder one level above, so `cd ..` moves up:

```terminal
~ $ cd documents               # change directory: step into documents
~/documents $ ls               # the prompt shows the new folder
letter.txt                     # a file
~/documents $ cd ..            # one folder up, back home
~ $ cd projects/recipes
~/projects/recipes $ ls
soup.txt
~/projects/recipes $
```

The file explorer below shows `recipes`, the folder reached with `cd projects/recipes`:

```files ~/projects/recipes
documents/
  letter.txt
projects/
  recipes/
    soup.txt
```

A path can take you more than one folder down at once. `cd projects/recipes` goes into `projects`, then into `recipes` inside it.

> [!TIP] Two keys that save typing
> The up arrow recalls your last command. Tab completes a file or folder name when there is one match. For example, type `cd proj`, then press Tab to complete it to `cd projects`.

```quiz
id: quiz-cd-up
question: "`pwd` shows `/home/user/projects/recipes`. You run `cd ..`. Where are you now?"
options:
  - text: "`/home/user/projects`"
  - text: "`/home/user`, your home folder"
    whyWrong: "`cd ..` climbs one level only, from `recipes` up to `projects`."
  - text: The root folder, `/`, at the very top
    whyWrong: "`..` climbs one folder, not all the way to the top."
correctIndex: 0
explanation: "`..` is the folder above the one you're in, so you're in `projects`."
```

```sandbox-exercise
id: find-your-way
title: "Practice: move between folders"
mode: guided
brief: Start in your home folder. Find `recipes` inside `projects`, then return home. Run `help` to see the available commands.
seed:
  dir: ""
  setup:
    - story: home-files
goals:
  - id: where-am-i
    label: You've checked which folder you're in
    narration: Run `pwd` to see which folder you're in.
    hints:
      - The command's name is short for print working directory.
      - Run `pwd`.
    check:
      kind: last-command
      startsWith: pwd
  - id: look-around
    label: You've listed what's in your home folder
    narration: Run `ls` to list what's in your home folder.
    hints:
      - The command's name is short for list.
      - Run `ls`.
    check:
      kind: last-command
      startsWith: ls
  - id: into-projects
    label: You're in `projects`
    narration: Step into the `projects` folder with `cd projects`. Watch the prompt change to show where you are.
    hints:
      - "`cd` is short for change directory, and the folder's name goes after it."
      - Run `cd projects`.
    check:
      kind: any-of
      checks:
        - { kind: current-folder, path: projects }
        - { kind: current-folder, path: projects/recipes }
  - id: into-recipes
    label: You've listed what's in `recipes`
    narration: Now step into `recipes` and list what's in it.
    hints:
      - The prompt shows `~/projects`, and `recipes` is inside it.
      - Run `cd recipes`, then `ls`.
    check:
      kind: all-of
      checks:
        - { kind: current-folder, path: projects/recipes }
        - { kind: last-command, startsWith: ls }
  - id: back-home
    label: You're back in your home folder
    narration: Climb back out with `cd ..` until the prompt shows `~` again.
    hints:
      - Two dots mean the folder above the one you're in.
      - Each `cd ..` climbs one folder, so run it until the prompt shows `~`.
      - Run `cd ..`, and once more if the prompt doesn't show `~` yet.
    check:
      kind: current-folder
      path: ""
completionMessage: You went two folders down and back home, with `pwd`, `ls`, and `cd`.
```

## Recap {#recap}

You can now:

- Say why we learn Git by typing commands
- Read a path like `~/projects/recipes`
- Find which folder you're in and what's inside
- Move into a folder and back out

```bash
pwd             # which folder am I in
ls              # what's in this folder
cd projects     # go into a folder
cd ..           # go back up one folder
```

> [!TIP] Look up commands later
> The cheat sheet button at the top right of every lesson lists the course's commands and what each one does.

Next up: starting a Git repository for the to-do app we've prepared.
