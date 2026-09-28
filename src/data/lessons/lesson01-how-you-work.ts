import type { Lesson } from '@/types'
export default {
  id: 1,
  title: "How You'll Work",
  description: 'Meet the terminal and tell Git who you are',
  unlocks: ['config', 'commit'],
  steps: [
    {
      type: 'reading',
      id: 'terminal-basics',
      title: 'Meeting your terminal',
      content: [
        {
          type: 'text',
          value:
            'A **terminal** is a window where you tell a computer what to do by typing instead of clicking. You type a **command**, press Enter, and the computer does the thing and prints its answer underneath. Nothing runs until you press Enter, so a typo is always fixable up to that moment.',
        },
        {
          type: 'text',
          value:
            'You will hear that Git has no buttons. It does. Most people drive it from a panel in their editor, or from an app like GitHub Desktop, and those are good tools. What repeats in real work is not the typing. It is the loop: choose what changed, record it, branch off, merge back, share. A button is a front end over that same loop.',
        },
        {
          type: 'text',
          value:
            "Commands are the spine of this course for two reasons. They are the exact vocabulary every tool and every answer online uses, so `git commit` means the same thing in a manual, in a colleague's message, and behind the tick in an editor. And they are the form of Git an exercise can actually check.",
        },
        {
          type: 'text',
          value:
            'Commands often take extra words beginning with a dash, like `--global` or `-m`. Those are **flags**, and they change what the command does. Two dashes spell the word out. One dash is usually a single-letter shortcut for the same thing. You will meet plenty of them, and every one is explained where it first appears.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Let the up arrow do the typing',
          value:
            'Press the up arrow to bring back the command you just ran, and press it again to go further back. Fixing the line you already typed beats typing a long command out twice.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'moving-around',
      title: 'Finding your way around',
      content: [
        {
          type: 'text',
          value:
            'Your files live inside folders, and a terminal is always standing in one of them. What you type acts on the folder you are standing in, so knowing where you are is half the job. Four commands cover it:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'pwd              # print working directory: which folder am I in?\nls               # list: what is inside this folder?\ncd desserts      # change directory: go into the folder named desserts\ncd ..            # go back up to the folder that contains this one',
        },
        {
          type: 'text',
          value:
            'Here is a move through a recipe collection. Run `pwd` to see where you are, `ls` to see what is around you, then `cd` into the folder you want:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ pwd\n/home/user/cookbook\n$ ls\ndesserts  ragu.md  sourdough.md\n$ cd desserts\n$ pwd\n/home/user/cookbook/desserts\n$ ls\ntiramisu.md\n$ cd ..\n$ pwd\n/home/user/cookbook',
        },
        {
          type: 'text',
          value:
            '`cd` prints nothing when it works, which is why those two lines are followed straight by the next prompt. The two dots in `cd ..` always mean "the folder above this one". That is how you get back out of somewhere.',
        },
        {
          type: 'text',
          value:
            'A **tilde**, `~`, is shorthand for your **home folder**, the one holding Documents and Downloads. Here that is `/home/user`, so `~/cookbook` is the same folder as `/home/user/cookbook`. `cd ~` takes you home from anywhere.',
        },
        {
          type: 'text',
          value:
            'Two more commands let you read a file and write a short one without opening an editor:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'cat ragu.md                        # print what is inside a file\necho "Buy more flour" > todo.txt   # write that line into todo.txt',
        },
        {
          type: 'text',
          value:
            '`echo` prints whatever text you give it. The `>` sends that text into a file instead of onto the screen, creating the file if it does not exist yet. If the file does exist, `>` replaces everything in it, so it doubles as a quick way to rewrite a whole file. The practice terminals in this course have no editor, so you will use it a lot.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'your-identity',
      title: 'Telling Git who you are',
      content: [
        {
          type: 'text',
          value:
            'Every commit is stamped with a **name** and an **email**. That stamp is how anyone reading the history knows who made each change, and in six months that person is usually you. Git never guesses it.',
        },
        {
          type: 'text',
          value:
            'Ask for a commit before Git knows who you are, and it stops and tells you so:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ git commit -m "Add the first three recipes"\nAuthor identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account\'s default identity.\n\nfatal: unable to auto-detect email address (got \'user@sandbox.(none)\')',
        },
        {
          type: 'text',
          value:
            'The error hands you the fix. Set both values once and Git uses them for every project from then on:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.name "Your Name"\ngit config --global user.email "your@email.com"',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Which name and email?',
          value:
            'Use your real name, or the name your teammates know you by. This is a label for humans, not a login. For the email, use the address on your GitHub account if you have one. That address is how a hosting site recognises the commits as yours.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'config-scope',
      title: 'Global and local settings',
      content: [
        {
          type: 'text',
          value:
            '`--global` sets a value for every project on your machine. That is what you want for your name and email, and it is why you set them once rather than once per project.',
        },
        {
          type: 'text',
          value:
            'Drop `--global` and run the same command inside a project, and the value applies to that project alone. It overrides the global one there and nowhere else. The explicit flag for that is `--local`, and leaving the flag off does the same thing. It earns its keep the day a work project needs a different email from your personal one.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.email "me@personal.com"   # every project\ngit config user.email "me@work.com"                # this project only',
        },
        {
          type: 'text',
          value:
            'Reading a setting back is the same command with the value left off. Git answers with the value it would actually use where you are standing, checking the project first and the global setting second:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ git config user.name\nAda Lovelace\n$ git config --list\nuser.name=Ada Lovelace\nuser.email=ada@example.com',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-config',
      prompt: 'Build the command to set your name for every project on your machine:',
      availableBlocks: [
        'git',
        'config',
        '--global',
        'user.name',
        '--local',
        '"Your Name"',
        'set',
      ],
      correctAnswer: ['git', 'config', '--global', 'user.name', '"Your Name"'],
      hints: [
        'Start with "git config"',
        'Every project on your machine means the --global flag',
        'The order is: git config --global, then the setting name, then the value',
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'find-your-feet',
      title: 'Practice: look around, then sign your work',
      mode: 'guided',
      brief:
        'Below is a recipe collection called `cookbook`. It holds two recipes, a folder called `desserts`, and no history at all. Its files are already lined up ready to be recorded, but nothing has been recorded yet, because Git has never been told who you are. Find your way around the project, leave yourself a note, then introduce yourself. Type `help` for the list of commands it knows.',
      seed: {
        dir: 'cookbook',
        identity: { name: '', email: '' },
        setup: [
          { run: 'git init' },
          {
            write: {
              'sourdough.md': '# Sourdough\n\n500g flour, 350g water, 100g starter, 10g salt.\n',
              'ragu.md': '# Ragu\n\nSoffritto, mince, milk, tomato, three hours.\n',
              'desserts/tiramisu.md': '# Tiramisu\n\nMascarpone, egg yolk, sugar, espresso.\n',
            },
          },
          { run: 'git add sourdough.md ragu.md desserts/tiramisu.md' },
        ],
      },
      goals: [
        {
          id: 'leave-a-note',
          label: 'A file called `todo.txt` sits at the top of the project',
          narration:
            'Start by working out where you are and what is around you. Run `pwd`, then `ls`. Step into the `desserts` folder with `cd desserts`, look again, then come back up with `cd ..`. Once you are back at the top of the project, write yourself a note there: `echo "Try the ragu with less salt" > todo.txt` creates a file with that line in it. The note has to land at the top of the project, not inside `desserts`, so check `pwd` before you run it.',
          hints: [
            'A command acts on the folder you are standing in. Run `pwd` to see which one that is.',
            'If `pwd` ends in `/desserts`, run `cd ..` to climb back up one folder.',
            'From `~/cookbook`, run `echo "Try the ragu with less salt" > todo.txt`.',
          ],
          check: { kind: 'file-present', path: 'todo.txt' },
        },
        {
          id: 'sign-your-work',
          label: 'The project has its first commit',
          narration:
            'The recipes are already lined up, waiting to be recorded. Try `git commit -m "Add the first three recipes"` and read what comes back. Git will not record anything until it knows whose work this is, so set your name and email with `git config --global`, then run the commit again. Afterwards, read the setting back with `git config user.name`.',
          hints: [
            'Run the commit first and read the error. It names the two commands you are missing.',
            'Set both values: `git config --global user.name` and `git config --global user.email`, each followed by a value in quotes.',
            'Run `git config --global user.name "Ada Lovelace"`, then `git config --global user.email "ada@example.com"`, then `git commit -m "Add the first three recipes"`.',
          ],
          check: { kind: 'commit-exists' },
        },
      ],
      completionMessage:
        'Your name and email are on that commit and on every commit you make from here. Run `git log` to see the stamp, and `git config --list` to see the two settings you just made. The terminal stays live, so keep poking at it.',
    },
    {
      type: 'quiz',
      id: 'quiz-config',
      question:
        'Last week you ran `git config --global user.name "Jane Doe"`. Today you start a brand-new project in a different folder. What name will Git put on commits there?',
      options: [
        {
          text: 'No name. Git refuses to commit until you set your name again inside the new folder.',
          whyWrong:
            'Git only stops you when it has no name anywhere. Your global setting is still in place, so it has one.',
        },
        {
          text: 'Whatever name is on your GitHub account, because GitHub overrides your local settings.',
          whyWrong:
            'GitHub never reaches into your computer to change settings. Git reads only the config files on your machine when it stamps a commit.',
        },
        {
          text: 'Jane Doe, because `--global` applies to every project on your machine.',
        },
        {
          text: 'Jane Doe, but only after you also run `git config --local user.name "Jane Doe"` in the new folder.',
          whyWrong:
            '`--local` is for the case where one project needs a different value. Repeating the same name locally changes nothing.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Git looks for a setting in the current project first, then falls back to your global config. Nothing local overrides it here, so the new project inherits "Jane Doe". You set your identity once, not once per project.',
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
            'Run a command in a terminal, and tell a flag apart from the rest of the line',
            'Find out which folder you are standing in, see what is in it, and move between folders',
            'Read a file with `cat`, and write a short one with `echo` and `>`',
            'Tell Git your name and email so every commit is stamped with them',
            'Choose between a setting for every project and a setting for one project',
            'Read any setting back when you are not sure what Git thinks',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'pwd                                  # which folder am I in\nls                                   # what is in this folder\ncd desserts                          # go into a folder\ncd ..                                # go back up one folder\ncd ~                                 # go to your home folder\ncat ragu.md                          # print what is inside a file\necho "..." > todo.txt                # write a line into a file, replacing what was there\ngit config --global user.name "..."  # set your name for every project\ngit config --global user.email "..." # set your email for every project\ngit config user.name                 # read one setting back\ngit config --list                    # show every setting',
        },
        {
          type: 'text',
          value:
            'Next up: you turn an ordinary folder into a Git project, so Git can start keeping track of what you change.',
        },
      ],
    },
  ],
} satisfies Lesson
