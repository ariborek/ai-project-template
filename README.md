# Reusable AI-Assisted Project Template

This repository is a professional starting point for projects developed with human review and AI coding assistants. It provides shared instructions, planning documents, workflow guidance, and repository conventions without assuming that application code, dependencies, scripts, or tests already exist.

## Customize this template first

- [ ] Replace every bracketed placeholder with project-specific information.
- [ ] Complete `docs/PROJECT_BRIEF.md` and resolve important open questions.
- [ ] Update `AGENTS.md` with the real stack, directories, commands, and stable conventions.
- [ ] Decide which environments and deployment target the project will use.
- [ ] For non-Node projects, remove or adjust `.node-version` and Node-specific `.gitignore` entries.
- [ ] Add project-specific setup and validation commands only after they actually exist.
- [ ] Review repository rules with every contributor and coding agent.

## Project context

- **Project name:** `[PROJECT_NAME]`
- **Purpose:** `[PROJECT_PURPOSE]`
- **Target users:** `[TARGET_USERS]`
- **Technology stack:** `[TECHNOLOGY_STACK]`
- **Environments:** `[LOCAL_STAGING_PRODUCTION_OR_OTHER]`
- **Deployment target:** `[DEPLOYMENT_TARGET]`

## Intended repository workflow

1. Create or switch to a focused feature branch.
2. Inspect the repository state and relevant files.
3. Plan and make the smallest safe edit.
4. Validate the change with the project's documented checks.
5. Review the full diff for scope, quality, and secrets.
6. Commit with a clear message.
7. Push the branch.
8. Open a pull request and complete review.
9. Merge only after approval and successful checks.

Git write operations and remote actions require explicit authorization when an AI agent is performing them. See `docs/WORKFLOW.md` for beginner-friendly guidance.

## Shared AI instructions

`AGENTS.md` is the canonical instruction file for contributors and compatible AI agents, including Codex. `CLAUDE.md` points Claude Code to that same file, keeping both tools aligned without duplicating rules.

## Repository structure

- `AGENTS.md` — canonical project context, safety rules, and working conventions.
- `CLAUDE.md` — directs Claude Code to the shared instructions.
- `README.md` — explains how to customize and use this template.
- `.node-version` — declares the intended Node.js version when Node is adopted.
- `.editorconfig` — defines baseline text formatting across editors.
- `package.json` — provides dependency-free validation and test commands.
- `scripts/validate-template.mjs` — validates template structure, hygiene, and safety.
- `scripts/validate-template.test.mjs` — tests the repository validator with temporary fixtures.
- `.github/pull_request_template.md` — provides a consistent pull-request checklist.
- `.github/workflows/validate.yml` — runs repository checks in GitHub Actions.
- `docs/PROJECT_BRIEF.md` — captures the project's problem, scope, users, and success criteria.
- `docs/DECISIONS.md` — records durable architectural and workflow decisions.
- `docs/WORKFLOW.md` — explains the branch, review, and merge process.

## Secrets and environment variables

Never commit passwords, tokens, API keys, private certificates, or real environment values. Keep local values in ignored `.env` files. When configuration examples are needed, commit a sanitized `.env.example` containing variable names and safe placeholder values only. Document where authorized contributors obtain real values without recording the values themselves.

## Validation commands

The repository validation layer uses only built-in Node.js modules, so no dependency installation is needed.

```sh
npm run validate
npm test
npm run check
```

`npm run check` runs validation and the validator's tests. GitHub Actions runs the same command for pull requests and pushes to `main`.

### Schema version 1 and validation modes

`templateValidation.schemaVersion` set to the integer `1` means the repository follows version 1 of this template's validation contract. That contract lets compatible tools, such as `ai-project-bootstrap`, understand the expected configuration and validation behavior. This does not imply that any such tool is finished or publicly available.

The `templateValidation.mode` setting controls placeholder validation:

- `template` mode is for the reusable starter and generated repositories that still contain documented placeholders.
- `project` mode is for a real project after every documented reusable placeholder has been replaced; unresolved placeholders then fail validation.

Do not manually bypass validation. If the schema version is missing or unsupported, compare the repository with the current canonical `ai-project-template` instead of guessing or changing the version silently.

For a generated project, use this safe sequence:

1. Create the repository from the template.
2. Clone the generated repository.
3. Create a focused feature branch.
4. Customize all documented fields and reusable placeholders.
5. Change `templateValidation.mode` to `project`.
6. Run `npm run check`.
7. Review the changes, then commit them.

Non-Node projects may remove or replace `.node-version`, `package.json`, the Node-specific `.gitignore` entries, and this validation layer with suitable equivalents.

## Definition of done

- [ ] The requested scope is complete and no unrelated changes are included.
- [ ] Relevant formatting, linting, tests, and build checks have passed, or unavailable checks are documented.
- [ ] The changed files and full diff have been reviewed.
- [ ] Documentation reflects the implemented behavior and commands.
- [ ] No secrets or private environment values are present.
- [ ] Remaining risks and follow-up work are recorded.
- [ ] The pull request has received the required review before merge.
