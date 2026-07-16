# Shared Project Instructions

This repository is a reusable starter for AI-assisted projects. Customize this file and the supporting documentation for every real project before implementation begins.

## Project context

- Project name: `[PROJECT_NAME]`
- Purpose: `[PROJECT_PURPOSE]`
- Technology stack: `[TECHNOLOGY_STACK]`
- Important directories: `[IMPORTANT_DIRECTORIES]`
- Available repository checks: `npm run validate`, `npm test`, and `npm run check`
- Additional project commands: `[PROJECT_COMMANDS]`

## Required workflow

1. Inspect the relevant files and current repository state before editing.
2. State a concise implementation plan.
3. Make the smallest safe change that satisfies the request.
4. Verify the result before claiming success.

Run `npm run check` before claiming template or documentation work is complete. In `package.json`, `templateValidation.mode` is `template` while this repository retains reusable placeholders; change it to `project` only after a real project replaces them.

## Template validation schema

- `templateValidation.schemaVersion` must remain the integer `1`. Agents must not guess, remove, bypass, or silently change it.
- `templateValidation.mode` must be either `"template"` or `"project"`.
- Generated repositories begin in `template` mode. After replacing all documented reusable placeholders, change the mode to `project`.
- For a missing or unsupported schema version, compare the repository with the current canonical `ai-project-template`.
- `npm run check` must pass before work is considered complete.

## Boundaries and safety

- Work only inside this repository unless explicitly authorized otherwise.
- Never request, expose, copy, or commit secrets, credentials, tokens, or private environment values.
- Do not install packages, change dependencies, run destructive commands, perform Git write operations, deploy, or act on external services without explicit authorization.
- Preserve existing functionality, conventions, and formatting. Avoid unrelated cleanup or speculative refactoring.

## Definition of done

Work is complete only when the requested scope is implemented, relevant checks pass or failures are clearly explained, documentation is updated when needed, and no known secrets or unrelated changes are included.

The final report must list every file changed, checks performed, results, and remaining risks or follow-up work. Update this file when stable project-specific conventions become known.
