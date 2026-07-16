# Repository Workflow

Use a focused branch and pull request for each change. This keeps the default branch stable, makes work reviewable, and provides a clear place to discuss corrections. Beginners can use GitHub Desktop for routine Git actions and VS Code for file editing; ask before proceeding whenever a command or button is unclear.

## Tool roles

- **ChatGPT:** helps clarify requirements, explore approaches, and explain unfamiliar concepts.
- **Claude and Claude Code:** assist with planning and repository work while following `CLAUDE.md` and the shared `AGENTS.md` rules.
- **Codex:** inspects, edits, and validates repository work while following `AGENTS.md`.
- **VS Code:** edits files, searches the project, and displays source-control changes.
- **GitHub Desktop:** provides a visual workflow for branches, commits, pushes, pulls, and history.
- **GitHub:** hosts the remote repository, pull requests, reviews, and repository checks.

Do not let two coding agents edit the same files simultaneously. Assign separate files or wait for one agent to finish, then review its changes before starting the other.

## Safe branch and pull-request flow

1. Sync the default branch using GitHub Desktop or an approved Git command.
2. Create a descriptively named branch for one focused change.
3. Inspect the status, instructions, relevant files, and existing behavior.
4. State a short plan, make the smallest safe edit, and run relevant checks.
5. Run `npm run check`, then review every changed line before creating a commit.
6. Commit with a concise message that explains the completed change.
7. Push the feature branch and open a pull request on GitHub.
8. Complete automated checks and human review; make corrections on the same branch.
9. Merge only after approval, then update the local default branch.

AI agents must receive explicit authorization before Git write operations, pushes, pull requests, merges, deployments, or external-service actions.

The current validation layer uses built-in Node.js modules, so it requires no dependency installation. GitHub Actions reruns `npm run check` when changes are pushed to `main` and whenever a pull request is opened or updated. Investigate and resolve failed checks before merging. Automated checks supplement human review; they do not replace reviewing every changed file.

## Pre-work checklist

- [ ] Confirm the intended repository and branch.
- [ ] Confirm the working tree state and understand existing changes.
- [ ] Read `AGENTS.md` and relevant documentation.
- [ ] Inspect the files and behavior involved.
- [ ] Define a focused scope and concise plan.
- [ ] Ensure no other coding agent is editing the same files.

## Review checklist

- [ ] Review the full diff and every changed file.
- [ ] Confirm the change matches the request and avoids unrelated cleanup.
- [ ] Run relevant checks and record their results.
- [ ] Confirm documentation and examples match actual behavior.
- [ ] Check that no secrets, credentials, or private values are included.
- [ ] Record known risks and follow-up work.

## Merge checklist

- [ ] The pull request has a clear summary and rationale.
- [ ] Required checks pass or approved exceptions are documented.
- [ ] Review feedback is resolved and approval is recorded.
- [ ] The branch is current enough to merge safely.
- [ ] The final changed-file list contains only intended work.
- [ ] The selected merge action and target branch are correct.
