import type { Lesson } from '@/types'
export default {
  id: 10,
  title: 'Common Git Problems',
  description: 'Fix mistakes, undo changes, and recover lost work',
  steps: [
    {
      type: 'reading',
      id: 'common-problems-intro',
      title: 'Everyone Makes Mistakes',
      content: [
        {
          type: 'text',
          value:
            'Git gives you powerful tools to undo mistakes — from accidentally staging the wrong file to making a bad commit. This lesson covers the most common problems you\'ll run into and how to fix them.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'email-mismatch',
      title: 'Commits Show "Unknown User" on GitHub',
      content: [
        {
          type: 'text',
          value:
            'You pushed your code to GitHub, but your commits show up as authored by an unknown user with a generic avatar. This is one of the most common beginner issues.',
        },
        {
          type: 'text',
          value:
            '**Cause:** The email in your `git config user.email` does not match any email on your GitHub account. GitHub links commits to profiles by matching the email in the commit metadata.',
        },
        {
          type: 'text',
          value:
            '**Fix (option 1):** Add your Git email to your GitHub account. Go to **GitHub Settings > Emails** and add the email you used in Git. GitHub will retroactively link those commits to your profile.',
        },
        {
          type: 'text',
          value:
            '**Fix (option 2):** Change your Git config to match your GitHub email:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.email "your-github-email@example.com"',
        },
        {
          type: 'text',
          value:
            'This only affects **new** commits. If you set this up correctly in the setup lesson, you should not run into this problem — but now you know how to fix it if you do.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'restore-unstage',
      title: 'Unstaging and Restoring Files',
      visualization: 'restore-walkthrough',
      content: [
        {
          type: 'text',
          value:
            'If you accidentally staged a file, you can unstage it without losing your edits:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Unstage a file (keep changes in working directory):\ngit restore --staged filename.txt\n\n# Discard changes in working directory (DANGEROUS — changes are lost!):\ngit restore filename.txt',
        },
        {
          type: 'text',
          value:
            'In older Git versions, you may see `git checkout -- filename.txt` for discarding changes and `git reset HEAD filename.txt` for unstaging. The modern `git restore` command is clearer and safer.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-restore-staged',
      prompt: 'Build the command to unstage "filename.txt" without losing your edits:',
      availableBlocks: ['git', 'restore', 'reset', '--staged', '--hard', 'filename.txt', 'HEAD'],
      correctAnswer: ['git', 'restore', '--staged', 'filename.txt'],
      hints: [
        'Use git restore with the --staged flag',
        'This keeps your edits in the working directory but removes them from staging',
      ],
    },
    {
      type: 'reading',
      id: 'revert-commit',
      title: 'Reverting Commits',
      content: [
        {
          type: 'text',
          value:
            '`git revert` creates a **new commit** that undoes the changes from a previous commit. The original commit stays in history — nothing is erased.',
        },
        {
          type: 'text',
          value:
            '`HEAD~N` means "N commits before HEAD." So `HEAD~1` is the previous commit, `HEAD~2` is two commits back, and so on. You can also use a specific commit hash instead.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Undo the most recent commit:\ngit revert HEAD\n\n# Undo a specific commit by hash:\ngit revert a1b2c3d',
        },
        {
          type: 'text',
          value:
            'Because `revert` adds a new commit instead of removing old ones, it is **always safe** to use on shared branches. Your teammates will see the undo in the history and understand what happened.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'revert-head',
      prompt: 'Safely undo the most recent commit by creating a new revert commit:',
      expectedCommand: 'git revert HEAD',
      acceptableVariants: ['git revert HEAD --no-edit'],
      successOutput:
        '[main b4c5d6e] Revert "Add broken feature"\n 1 file changed, 0 insertions(+), 3 deletions(-)',
      hints: [
        'Use git revert to create an undo commit',
        'HEAD refers to the most recent commit',
      ],
    },
    {
      type: 'reading',
      id: 'amend-commit',
      title: 'Amending the Last Commit',
      content: [
        {
          type: 'text',
          value:
            'If you just made a commit and realize you forgot a file or made a typo in the message, you can amend it instead of creating a whole new commit:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Fix the commit message:\ngit commit --amend -m "Corrected commit message"\n\n# Add a forgotten file to the last commit:\ngit add forgotten-file.txt\ngit commit --amend --no-edit',
        },
        {
          type: 'text',
          value:
            'The `--no-edit` flag keeps the original commit message. Amending **replaces** the last commit with a new one (new hash), so do not amend commits that have already been pushed to a shared branch.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'amend-message',
      prompt: 'Fix the last commit message to "Fix typo in README":',
      expectedCommand: 'git commit --amend -m "Fix typo in README"',
      acceptableVariants: [
        "git commit --amend -m 'Fix typo in README'",
      ],
      successOutput:
        '[main e7f8g9h] Fix typo in README\n Date: Mon Jan 1 12:00:00 2024 +0000\n 1 file changed, 1 insertion(+), 1 deletion(-)',
      hints: [
        'Use git commit --amend with -m to change the message',
        'The -m flag lets you write the new message inline',
      ],
    },
    {
      type: 'reading',
      id: 'reset-modes',
      title: 'Understanding git reset',
      visualization: 'reset-walkthrough',
      content: [
        {
          type: 'text',
          value:
            '`git reset` moves the branch pointer backward. It has three modes that control what happens to your changes:',
        },
        {
          type: 'text',
          value:
            '- **`--soft`** — Moves HEAD back but keeps changes staged. Your code is untouched and ready to re-commit — useful for rewording a commit message or combining commits.\n- **`--mixed`** (default) — Moves HEAD back and unstages changes, but keeps them in the working directory. Your code is untouched, but you need to `git add` again before committing.\n- **`--hard`** — Moves HEAD back and **discards all changes**. Your code is reverted. This is destructive!',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git reset --soft HEAD~1   # Undo last commit, keep changes staged\ngit reset HEAD~1          # Undo last commit, unstage changes\ngit reset --hard HEAD~1   # Undo last commit AND discard changes',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-reset-soft',
      prompt: 'Build the command to undo the last commit but keep your changes staged:',
      availableBlocks: ['git', 'reset', 'restore', '--soft', '--hard', '--mixed', 'HEAD~1', 'HEAD'],
      correctAnswer: ['git', 'reset', '--soft', 'HEAD~1'],
      hints: [
        'Use git reset with the mode that keeps changes staged',
        '--soft keeps changes in the staging area',
      ],
    },
    {
      type: 'reading',
      id: 'reflog-safety',
      title: 'The Safety Net: git reflog',
      content: [
        {
          type: 'text',
          value:
            'Made a mistake with `git reset --hard` and lost commits? Don\'t panic. Git keeps a log of every time HEAD moved — this is called the **reflog** (reference log):',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# See where HEAD has been:\ngit reflog\n\n# Example output:\na1b2c3d HEAD@{0}: reset: moving to HEAD~1\nf4e5d6c HEAD@{1}: commit: Add new feature\n9g8h7i6 HEAD@{2}: commit: Fix bug\n\n# Recover the lost commit:\ngit reset --hard f4e5d6c',
        },
        {
          type: 'text',
          value:
            'The reflog records every commit HEAD pointed to, even ones removed by `git reset`. As long as the commit happened on your machine, you can find its hash in the reflog and recover it. The reflog isn\'t permanent, but it\'s a lifesaver for recent mistakes.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'clear-history',
      title: 'Starting Fresh: Deleting Git History',
      content: [
        {
          type: 'text',
          value:
            'Sometimes you want to completely erase your Git history and start fresh — for example, if you accidentally committed large files, secrets, or sensitive data that should never have been in the repository.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# WARNING: This permanently deletes ALL Git history!\nrm -rf .git\ngit init\ngit add .\ngit commit -m "Initial commit"',
        },
        {
          type: 'text',
          value:
            '**When this makes sense:** You are starting a personal project, the repo is not shared, and you want a clean slate. This is also common when a tutorial project accumulates messy history and you want to publish a clean version.',
        },
        {
          type: 'text',
          value:
            '**Warning:** This is **permanent and irreversible**. All commits, branches, and tags are gone forever. If the repo has been pushed to a remote, starting fresh locally will put your history out of sync — fixing that is complicated and can affect collaborators. Use this only as a last resort on repos where you\'re the sole contributor.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'when-safe-to-rewrite',
      title: 'When Is It Safe to Rewrite History?',
      content: [
        {
          type: 'text',
          value:
            'Commands like `amend` and `reset` **rewrite history** — they change commit hashes. The golden rule:',
        },
        {
          type: 'text',
          value:
            '**Local only = safe.** If the commits exist only on your machine, rewrite all you want. Nobody else is affected.\n\n**Already pushed = dangerous.** If you rewrite commits that others have pulled, their history diverges from yours. This causes confusing merge conflicts and lost work.',
        },
        {
          type: 'text',
          value:
            'When in doubt, use `git revert` instead — it undoes changes without rewriting history.',
        },
        {
          type: 'text',
          value:
            'If you *do* rewrite a commit you already pushed — say you amended it on your own feature branch — a normal push is rejected, because the remote no longer matches. The fix is **not** `--force`:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Refuses if someone else pushed in the meantime:\ngit push --force-with-lease\n\n# Overwrites whatever is there — avoid:\ngit push --force',
        },
        {
          type: 'text',
          value:
            '`--force-with-lease` only overwrites the remote if it still looks the way you last saw it. If a teammate pushed something you have not seen, the push is rejected instead of silently destroying their work. Use it on your own branches, and never on shared ones like `main`.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-restore-vs-revert',
      question: 'What is the difference between `git restore` and `git revert`?',
      options: [
        'restore affects working directory/staging; revert undoes a commit by creating a new one',
        'There is no difference — they do the same thing',
        'restore undoes commits; revert restores files',
        'revert deletes commits from history; restore does not',
      ],
      correctIndex: 0,
      explanation:
        '`git restore` works on files — it can unstage them or discard working directory changes. `git revert` works on commits — it creates a new commit that reverses the changes from a specified commit, keeping the original in history.',
    },
    {
      type: 'quiz',
      id: 'quiz-reset-vs-revert',
      question: 'Which command is safest to undo a commit that has already been pushed to a shared branch?',
      options: [
        'git revert HEAD',
        'git reset --hard HEAD~1',
        'git restore HEAD',
        'git reset --soft HEAD~1',
      ],
      correctIndex: 0,
      explanation:
        'git revert creates a new commit that undoes the changes, preserving history. This is safe for shared branches because it does not rewrite history. git reset rewrites history and can cause problems for collaborators.',
    },
    {
      type: 'quiz',
      id: 'quiz-undo-pushed',
      question:
        'You just pushed a commit to the shared main branch that accidentally deleted an important config file. Your teammates are actively pulling from main. What\'s the safest way to undo it?',
      options: [
        '`git revert HEAD`',
        '`git reset --hard HEAD~1`',
        '`git restore config.json`',
        '`git commit --amend`',
      ],
      correctIndex: 0,
      explanation:
        '`git revert HEAD` creates a new commit that undoes the deletion without rewriting history. Your teammates see the fix cleanly. `git reset` would rewrite shared history and cause problems for everyone who already pulled.',
    },
    {
      type: 'quiz',
      id: 'quiz-wrong-branch',
      question:
        'You accidentally made three commits on main. They should have been on a new branch called "add-search". Nothing has been pushed yet. What should you do?',
      options: [
        'Create the branch first with `git branch add-search`, then reset main back with `git reset --hard HEAD~3`',
        'Just run `git switch -c add-search`',
        'Revert all three commits with `git revert`',
        'Delete the commits with `git reset --hard HEAD~3` and start over',
      ],
      correctIndex: 0,
      explanation:
        'Creating the branch first saves your commits on that branch. Then resetting main moves it back 3 commits. The two-step order matters — if you reset first, the commits are gone before the branch can keep them.',
    },
  ],
} satisfies Lesson
