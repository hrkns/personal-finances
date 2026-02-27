const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "data",
  "test-results",
  "web",
  "docs",
  "e2e",
  "migrations",
]);

function collectGoFiles(rootDir) {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          stack.push(absolutePath);
        }
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".go")) {
        files.push(path.relative(rootDir, absolutePath));
      }
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function runOrExit(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    shell: false,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    console.error(`Failed to run '${command}': ${result.error.message}`);
    process.exit(1);
  }

  return result;
}

function main() {
  const shouldCheckFormatting = process.argv.includes("--fmtcheck");

  if (shouldCheckFormatting) {
    const goFiles = collectGoFiles(process.cwd());

    if (goFiles.length === 0) {
      console.log("No Go files found.");
    } else {
      const gofmt = runOrExit("gofmt", ["-l", ...goFiles]);

      if (gofmt.status !== 0) {
        console.error("gofmt execution failed.");

        if (gofmt.stdout) {
          process.stdout.write(gofmt.stdout);
        }

        if (gofmt.stderr) {
          process.stderr.write(gofmt.stderr);
        }

        process.exit(gofmt.status ?? 1);
      }

      const notFormatted = gofmt.stdout.trim();

      if (notFormatted.length > 0) {
        console.error("gofmt check failed. The following files need formatting:");
        console.error(notFormatted);
        process.exit(1);
      }
    }
  }

  const govet = runOrExit("go", ["vet", "./..."], { cwd: process.cwd() });
  if (govet.status !== 0) {
    if (govet.stdout) {
      process.stdout.write(govet.stdout);
    }
    if (govet.stderr) {
      process.stderr.write(govet.stderr);
    }
    process.exit(govet.status ?? 1);
  }

  if (shouldCheckFormatting) {
    console.log("Go lint passed (gofmt + go vet).");
    return;
  }

  console.log("Go lint passed (go vet).");
}

main();
