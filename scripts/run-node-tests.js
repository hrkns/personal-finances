const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function collectFiles(rootDir, matcher) {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile() && matcher(absolutePath)) {
        files.push(absolutePath);
      }
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function toWorkspaceRelative(filePath) {
  return path.relative(process.cwd(), filePath);
}

function main() {
  const [targetDir = "web", mode = "all"] = process.argv.slice(2);
  const rootDir = path.resolve(process.cwd(), targetDir);

  if (!fs.existsSync(rootDir)) {
    console.error(`Test directory not found: ${targetDir}`);
    process.exit(1);
  }

  const matcher = (filePath) => {
    const fileName = path.basename(filePath);
    if (mode === "integration") {
      return fileName.endsWith(".integration.test.js");
    }

    if (mode === "unit") {
      return fileName.endsWith(".test.js") && !fileName.endsWith(".integration.test.js");
    }

    return fileName.endsWith(".test.js");
  };

  const files = collectFiles(rootDir, matcher).map(toWorkspaceRelative);

  if (files.length === 0) {
    console.error(`No matching test files found for mode '${mode}' in ${targetDir}`);
    process.exit(1);
  }

  const result = spawnSync(process.execPath, ["--test", ...files], {
    stdio: "inherit",
    shell: false,
  });

  process.exit(result.status ?? 1);
}

main();
