import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";
import { fileURLToPath } from "node:url";

import {
  validatePlaceholders,
  validateRepository,
} from "./validate-template.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const temporaryDirectories = [];
const placeholderFixtureFiles = new Map([
  [
    "AGENTS.md",
    "[PROJECT_NAME]\n[PROJECT_PURPOSE]\n[TECHNOLOGY_STACK]\n[IMPORTANT_DIRECTORIES]\n[PROJECT_COMMANDS]\n",
  ],
  [
    "README.md",
    "[PROJECT_NAME]\n[PROJECT_PURPOSE]\n[TARGET_USERS]\n[TECHNOLOGY_STACK]\n[LOCAL_STAGING_PRODUCTION_OR_OTHER]\n[DEPLOYMENT_TARGET]\n",
  ],
  ["docs/PROJECT_BRIEF.md", "[PROJECT_NAME]\n"],
  ["docs/WORKFLOW.md", "[PROJECT_COMMANDS]\n"],
  ["docs/DECISIONS.md", "No project decisions recorded.\n"],
]);
const unresolvedPlaceholderFiles = [
  "AGENTS.md",
  "README.md",
  "docs/PROJECT_BRIEF.md",
  "docs/WORKFLOW.md",
];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function createRepositoryFixture() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "template-validation-"));
  temporaryDirectories.push(temporaryRoot);
  const fixtureRoot = path.join(temporaryRoot, "repository");
  await cp(repositoryRoot, fixtureRoot, {
    recursive: true,
    filter(source) {
      const relative = path.relative(repositoryRoot, source);
      const parts = relative.split(path.sep);
      return !parts.includes(".git") && !parts.includes("node_modules");
    },
  });
  return fixtureRoot;
}

async function createPlaceholderFixture() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "placeholder-validation-"));
  temporaryDirectories.push(temporaryRoot);
  const fixtureRoot = path.join(temporaryRoot, "repository");
  await mkdir(path.join(fixtureRoot, "docs"), { recursive: true });
  await Promise.all(
    [...placeholderFixtureFiles].map(([relativeFile, content]) =>
      writeFile(path.join(fixtureRoot, relativeFile), content, "utf8"),
    ),
  );
  return fixtureRoot;
}

async function replaceFile(fixtureRoot, relativeFile, transform) {
  const filePath = path.join(fixtureRoot, relativeFile);
  const current = await readFile(filePath, "utf8");
  await writeFile(filePath, transform(current), "utf8");
}

test("the current repository passes validation", async () => {
  const result = await validateRepository(repositoryRoot);
  assert.deepEqual(result.failures, []);
  assert.equal(result.passed, true);
});

test("an incorrect CLAUDE.md fails", async () => {
  const fixtureRoot = await createRepositoryFixture();
  await writeFile(path.join(fixtureRoot, "CLAUDE.md"), "Incorrect\n", "utf8");

  const result = await validateRepository(fixtureRoot);
  assert.equal(result.passed, false);
  assert(result.failures.some((failure) => failure.startsWith("CLAUDE.md:")));
});

test("a required file missing its final newline fails", async () => {
  const fixtureRoot = await createRepositoryFixture();
  await replaceFile(fixtureRoot, ".editorconfig", (content) => content.trimEnd());

  const result = await validateRepository(fixtureRoot);
  assert.equal(result.passed, false);
  assert(result.failures.includes(".editorconfig: final newline is required"));
});

test("an obvious secret-like value fails", async () => {
  const fixtureRoot = await createRepositoryFixture();
  const sample = ["gh", "p_", "A".repeat(36)].join("");
  await replaceFile(fixtureRoot, "README.md", (content) => `${content}${sample}\n`);

  const result = await validateRepository(fixtureRoot);
  assert.equal(result.passed, false);
  assert(
    result.failures.some((failure) =>
      failure.includes("possible GitHub personal access token found"),
    ),
  );
});

test("template mode accepts the intended placeholders", async () => {
  const fixtureRoot = await createPlaceholderFixture();
  const failures = await validatePlaceholders(fixtureRoot, "template");
  assert.deepEqual(failures, []);
});

test("project mode rejects unresolved placeholders", async () => {
  const fixtureRoot = await createPlaceholderFixture();
  const failures = await validatePlaceholders(fixtureRoot, "project");
  for (const relativeFile of unresolvedPlaceholderFiles) {
    assert(
      failures.some((failure) => failure.startsWith(`${relativeFile}:`)),
      `expected an unresolved placeholder failure for ${relativeFile}`,
    );
  }
  assert.equal(
    failures.some((failure) => failure.startsWith("docs/DECISIONS.md:")),
    false,
  );
});

test("a customized project-mode fixture passes placeholder validation", async () => {
  const fixtureRoot = await createPlaceholderFixture();
  const placeholderPattern =
    /\[[A-Z][A-Z0-9_-]*(?:\s*\|\s*[A-Z][A-Z0-9_-]*)*\]/g;
  for (const relativeFile of unresolvedPlaceholderFiles) {
    await replaceFile(fixtureRoot, relativeFile, (content) =>
      content.replaceAll(placeholderPattern, "Customized value"),
    );
  }

  const failures = await validatePlaceholders(fixtureRoot, "project");
  assert.deepEqual(failures, []);
});
