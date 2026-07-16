import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_FILES = [
  ".editorconfig",
  ".gitignore",
  ".node-version",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "package.json",
  "docs/PROJECT_BRIEF.md",
  "docs/DECISIONS.md",
  "docs/WORKFLOW.md",
  ".github/pull_request_template.md",
  ".github/workflows/validate.yml",
  "scripts/validate-template.mjs",
  "scripts/validate-template.test.mjs",
];

const EXPECTED_CLAUDE_CONTENT =
  "# Claude Code Project Instructions\n\n@AGENTS.md\n";
const EXPECTED_NODE_VERSION = "24.18.0\n";
const VALID_MODES = new Set(["template", "project"]);
const PLACEHOLDER_PATTERN =
  /\[[A-Z][A-Z0-9_-]*(?:\s*\|\s*[A-Z][A-Z0-9_-]*)*\]/g;

const TEMPLATE_PLACEHOLDERS = new Map([
  [
    "AGENTS.md",
    [
      "[PROJECT_NAME]",
      "[PROJECT_PURPOSE]",
      "[TECHNOLOGY_STACK]",
      "[IMPORTANT_DIRECTORIES]",
      "[PROJECT_COMMANDS]",
    ],
  ],
  [
    "README.md",
    [
      "[PROJECT_NAME]",
      "[PROJECT_PURPOSE]",
      "[TARGET_USERS]",
      "[TECHNOLOGY_STACK]",
      "[LOCAL_STAGING_PRODUCTION_OR_OTHER]",
      "[DEPLOYMENT_TARGET]",
    ],
  ],
  ["docs/PROJECT_BRIEF.md", ["[PROJECT_NAME]"]],
]);

const IGNORED_DIRECTORIES = new Set([
  ".docusaurus",
  ".dynamodb",
  ".fusebox",
  ".git",
  ".grunt",
  ".idea",
  ".cache",
  ".next",
  ".nyc_output",
  ".nuxt",
  ".output",
  ".parcel-cache",
  ".rpt2_cache",
  ".rts2_cache_cjs",
  ".rts2_cache_es",
  ".rts2_cache_umd",
  ".serverless",
  ".temp",
  ".vscode",
  ".yarn",
  "bower_components",
  "build",
  "coverage",
  "dist",
  "jspm_packages",
  "lib-cov",
  "node_modules",
  "out",
  "web_modules",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".conf",
  ".css",
  ".csv",
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".go",
  ".gql",
  ".graphql",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".kt",
  ".kts",
  ".md",
  ".mjs",
  ".node-version",
  ".php",
  ".properties",
  ".py",
  ".rb",
  ".rs",
  ".sh",
  ".sql",
  ".svelte",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
]);

const TEXT_FILENAMES = new Set([
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".node-version",
  "Makefile",
]);

function secretPatterns() {
  const pattern = (...parts) => new RegExp(parts.join(""), "g");

  return [
    {
      label: "private-key header",
      regex: pattern(
        "-----BEGIN ",
        "(?:RSA |EC |OPENSSH |DSA )?",
        "PRIVATE KEY-----",
      ),
    },
    {
      label: "GitHub personal access token",
      regex: pattern("gh", "p_", "[A-Za-z0-9]{36}"),
    },
    {
      label: "GitHub fine-grained token",
      regex: pattern("github", "_pat_", "[A-Za-z0-9_]{20,}"),
    },
    {
      label: "Anthropic API key",
      regex: pattern("sk", "-ant-", "[A-Za-z0-9_-]{20,}"),
    },
    {
      label: "OpenAI API key",
      regex: pattern("sk", "-(?!ant-)(?:proj-)?", "[A-Za-z0-9_-]{20,}"),
    },
    {
      label: "Stripe live secret key",
      regex: pattern("sk", "_live_", "[A-Za-z0-9]{16,}"),
    },
    {
      label: "AWS access key",
      regex: pattern("AK", "IA", "[0-9A-Z]{16}"),
    },
    {
      label: "Slack token",
      regex: pattern("xox", "[baprs]-", "[A-Za-z0-9-]{10,}"),
    },
  ];
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function isRelevantTextFile(filePath) {
  const basename = path.basename(filePath);
  return (
    TEXT_FILENAMES.has(basename) ||
    basename === ".env" ||
    basename.startsWith(".env.") ||
    TEXT_EXTENSIONS.has(path.extname(filePath))
  );
}

async function pathIsFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function collectTextFiles(root) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const isVitePressCache =
          entry.name === "cache" && path.basename(directory) === ".vitepress";
        if (!IGNORED_DIRECTORIES.has(entry.name) && !isVitePressCache) {
          await walk(entryPath);
        }
      } else if (entry.isFile() && isRelevantTextFile(entryPath)) {
        files.push(entryPath);
      }
    }
  }

  await walk(root);
  return files.sort();
}

export async function validateRequiredFiles(root) {
  const failures = [];
  for (const relativeFile of REQUIRED_FILES) {
    if (!(await pathIsFile(path.join(root, relativeFile)))) {
      failures.push(`${relativeFile}: required file is missing`);
    }
  }
  return failures;
}

export async function validateExactContent(root) {
  const failures = [];
  const checks = [
    ["CLAUDE.md", EXPECTED_CLAUDE_CONTENT],
    [".node-version", EXPECTED_NODE_VERSION],
  ];

  for (const [relativeFile, expected] of checks) {
    const filePath = path.join(root, relativeFile);
    if (!(await pathIsFile(filePath))) continue;
    const actual = await readFile(filePath, "utf8");
    if (actual !== expected) {
      failures.push(`${relativeFile}: content does not exactly match the required template`);
    }
  }
  return failures;
}

function versionAtLeast(actual, required) {
  const rangeMatch = /^>=\s*(\d+)\.(\d+)\.(\d+)$/.exec(actual);
  if (!rangeMatch) return false;
  const actualParts = rangeMatch.slice(1).map(Number);
  const requiredParts = required.split(".").map(Number);
  for (let index = 0; index < requiredParts.length; index += 1) {
    if (actualParts[index] > requiredParts[index]) return true;
    if (actualParts[index] < requiredParts[index]) return false;
  }
  return true;
}

export async function validatePackageJson(root) {
  const relativeFile = "package.json";
  const filePath = path.join(root, relativeFile);
  if (!(await pathIsFile(filePath))) return [];

  let packageJson;
  try {
    packageJson = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return [`${relativeFile}: invalid JSON (${error.message})`];
  }

  const failures = [];
  if (packageJson.private !== true) failures.push(`${relativeFile}: private must be true`);
  if (packageJson.type !== "module") failures.push(`${relativeFile}: type must be module`);
  if (!versionAtLeast(packageJson.engines?.node ?? "", "24.18.0")) {
    failures.push(`${relativeFile}: engines.node must be a >= range at or above 24.18.0`);
  }

  const expectedScripts = {
    validate: "node scripts/validate-template.mjs",
    test: "node --test scripts/validate-template.test.mjs",
    check: "npm run validate && npm test",
  };
  for (const [name, command] of Object.entries(expectedScripts)) {
    if (packageJson.scripts?.[name] !== command) {
      failures.push(`${relativeFile}: scripts.${name} must be ${JSON.stringify(command)}`);
    }
  }

  if (!VALID_MODES.has(packageJson.templateValidation?.mode)) {
    failures.push(`${relativeFile}: templateValidation.mode must be template or project`);
  }
  if ("dependencies" in packageJson || "devDependencies" in packageJson) {
    failures.push(`${relativeFile}: dependencies and devDependencies are not allowed`);
  }
  if ("packageManager" in packageJson) {
    failures.push(`${relativeFile}: packageManager is not allowed`);
  }

  return failures;
}

export async function validatePlaceholders(root, mode) {
  const failures = [];
  if (!VALID_MODES.has(mode)) {
    return [`package.json: unsupported templateValidation.mode ${JSON.stringify(mode)}`];
  }

  if (mode === "template") {
    for (const [relativeFile, placeholders] of TEMPLATE_PLACEHOLDERS) {
      const filePath = path.join(root, relativeFile);
      if (!(await pathIsFile(filePath))) continue;
      const content = await readFile(filePath, "utf8");
      for (const placeholder of placeholders) {
        if (!content.includes(placeholder)) {
          failures.push(`${relativeFile}: template mode requires ${placeholder}`);
        }
      }
    }
    return failures;
  }

  const files = ["AGENTS.md", "README.md"];
  const docsDirectory = path.join(root, "docs");
  try {
    const docsEntries = await readdir(docsDirectory, { withFileTypes: true });
    for (const entry of docsEntries) {
      if (entry.isFile() && path.extname(entry.name) === ".md") {
        files.push(`docs/${entry.name}`);
      }
    }
  } catch {
    // Missing required documentation is reported by required-file validation.
  }

  for (const relativeFile of files.sort()) {
    const filePath = path.join(root, relativeFile);
    if (!(await pathIsFile(filePath))) continue;
    const content = await readFile(filePath, "utf8");
    for (const match of content.matchAll(PLACEHOLDER_PATTERN)) {
      failures.push(
        `${relativeFile}:${lineNumberAt(content, match.index)}: unresolved placeholder ${match[0]}`,
      );
    }
  }
  return failures;
}

export async function validateTextHygiene(root) {
  const failures = [];
  for (const filePath of await collectTextFiles(root)) {
    const relativeFile = relativePath(root, filePath);
    const content = await readFile(filePath, "utf8");

    const crlfIndex = content.indexOf("\r\n");
    if (crlfIndex !== -1) {
      failures.push(`${relativeFile}:${lineNumberAt(content, crlfIndex)}: CRLF line ending found`);
    }
    if (!content.endsWith("\n")) {
      failures.push(`${relativeFile}: final newline is required`);
    }
    if (path.extname(filePath) !== ".md") {
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (/[\t ]+$/.test(line)) {
          failures.push(`${relativeFile}:${index + 1}: trailing whitespace found`);
        }
      });
    }
  }
  return failures;
}

export async function validateGitignore(root) {
  const filePath = path.join(root, ".gitignore");
  if (!(await pathIsFile(filePath))) return [];
  const patterns = new Set(
    (await readFile(filePath, "utf8"))
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")),
  );
  const failures = [];

  for (const required of [".env", ".env.*", "!.env.example"]) {
    if (!patterns.has(required)) failures.push(`.gitignore: missing ${required}`);
  }

  const categories = [
    ["build output", ["build/", "dist", "dist/", "out", "out/", ".next", ".output/"]],
    ["coverage output", ["coverage", "coverage/", "*.lcov"]],
    ["logs", ["*.log", "logs", "logs/"]],
    ["macOS metadata", [".DS_Store"]],
    ["local editor files", [".idea/", ".vscode/", "*.swp"]],
  ];
  for (const [label, alternatives] of categories) {
    if (!alternatives.some((entry) => patterns.has(entry))) {
      failures.push(`.gitignore: missing protection for ${label}`);
    }
  }
  return failures;
}

export async function validateSecrets(root) {
  const failures = [];
  const patterns = secretPatterns();
  for (const filePath of await collectTextFiles(root)) {
    const relativeFile = relativePath(root, filePath);
    const content = await readFile(filePath, "utf8");
    for (const { label, regex } of patterns) {
      regex.lastIndex = 0;
      for (const match of content.matchAll(regex)) {
        failures.push(
          `${relativeFile}:${lineNumberAt(content, match.index)}: possible ${label} found`,
        );
      }
    }
  }
  return failures;
}

export async function validateWorkflow(root) {
  const relativeFile = ".github/workflows/validate.yml";
  const filePath = path.join(root, relativeFile);
  if (!(await pathIsFile(filePath))) return [];
  const content = await readFile(filePath, "utf8");
  const failures = [];
  const requireMatch = (regex, message) => {
    if (!regex.test(content)) failures.push(`${relativeFile}: ${message}`);
  };

  requireMatch(
    /^on:\n {2}pull_request:\n {2}push:\n {4}branches:\n {6}- main\n {2}workflow_dispatch:\s*$/m,
    "triggers must be pull requests, pushes limited to main, and workflow_dispatch",
  );
  requireMatch(/^permissions:\s*\n\s*contents:\s*read\s*$/m, "permissions must be contents: read");
  requireMatch(/uses:\s*actions\/checkout@v7\s*$/m, "actions/checkout@v7 is required");
  requireMatch(/persist-credentials:\s*false\s*$/m, "checkout credentials must not persist");
  requireMatch(/uses:\s*actions\/setup-node@v6\s*$/m, "actions/setup-node@v6 is required");
  requireMatch(/node-version-file:\s*\.node-version\s*$/m, "setup-node must use .node-version");
  requireMatch(/package-manager-cache:\s*false\s*$/m, "package-manager caching must be disabled");
  requireMatch(/run:\s*npm run check\s*$/m, "npm run check is required");
  requireMatch(/timeout-minutes:\s*(?:[1-9]|[1-5][0-9])\s*$/m, "a reasonable timeout is required");

  const forbidden = [
    [/pull_request_target\s*:/, "pull_request_target is not allowed"],
    [/^permissions:\s*write\s*$/m, "write permissions are not allowed"],
    [
      /^[ \t]*[A-Za-z-]+:\s*write\s*$/m,
      "write permissions are not allowed",
    ],
    [/\$\{\{\s*secrets(?:\.|\[)/, "repository secrets are not allowed"],
    [/\bnpm\s+(?:ci|install|publish)\b/, "installing or publishing packages is not allowed"],
    [/actions\/upload-artifact@/, "artifact uploads are not allowed"],
    [/\b(?:deploy|deployment|gh-pages)\b/i, "deployment commands are not allowed"],
    [/\bgit\s+(?:commit|push)\b/, "Git write commands are not allowed"],
  ];
  for (const [regex, message] of forbidden) {
    if (regex.test(content)) failures.push(`${relativeFile}: ${message}`);
  }

  return failures;
}

async function configuredMode(root) {
  try {
    const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    return packageJson.templateValidation?.mode;
  } catch {
    return undefined;
  }
}

export async function validateRepository(root = process.cwd()) {
  const repositoryRoot = path.resolve(root);
  const failures = [];
  const validators = [
    validateRequiredFiles,
    validateExactContent,
    validatePackageJson,
    validateTextHygiene,
    validateGitignore,
    validateSecrets,
    validateWorkflow,
  ];

  for (const validator of validators) {
    try {
      failures.push(...(await validator(repositoryRoot)));
    } catch (error) {
      failures.push(`${validator.name}: ${error.message}`);
    }
  }
  failures.push(...(await validatePlaceholders(repositoryRoot, await configuredMode(repositoryRoot))));

  return { passed: failures.length === 0, failures };
}

export async function runCli(argv = process.argv.slice(2)) {
  const root = path.resolve(argv[0] ?? process.cwd());
  const result = await validateRepository(root);
  if (result.passed) {
    console.log(`PASS: repository validation succeeded (${root})`);
    return 0;
  }

  console.error(`FAIL: repository validation found ${result.failures.length} issue(s):`);
  result.failures.forEach((failure) => console.error(`- ${failure}`));
  return 1;
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  process.exitCode = await runCli();
}
