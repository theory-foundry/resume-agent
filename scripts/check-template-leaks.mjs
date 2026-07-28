import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".scss",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const forbidden = [
  ["lu", "kas"].join(""),
  ["soren", "sen"].join(""),
  ["sports", "digita"].join(""),
  ["digi", "deck"].join(""),
  ["side", "shift"].join(""),
];

const { stdout } = await execFileAsync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
);
const sourceFiles = stdout
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.split("/").some((part) => ["dist", ".next", "node_modules"].includes(part)));

async function collect(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) files.push(...(await collect(child)));
      else files.push(child);
    }
    return files;
  } catch {
    return [];
  }
}

const includeArtifacts = process.argv.includes("--artifacts");
const artifactFiles = includeArtifacts
  ? (await Promise.all([
      collect("apps/site/.next/static"),
      collect("packages/contracts/dist"),
      collect("packages/profile/dist"),
      collect("packages/widget/dist"),
      collect("packages/mcp/dist"),
      collect("packages/gateway/dist"),
      collect("packages/runtime/dist"),
    ])).flat()
  : [];
const files = [...new Set([...sourceFiles, ...artifactFiles])];

const findings = [];
for (const file of files) {
  const normalizedPath = file.toLowerCase();
  for (const token of forbidden) {
    if (normalizedPath.includes(token)) findings.push(`${file}: filename contains forbidden template identity token`);
  }
  if (!textExtensions.has(extname(file)) && ![".env.example", "LICENSE"].includes(file)) continue;
  let text;
  try {
    text = (await readFile(file, "utf8")).toLowerCase();
  } catch {
    continue;
  }
  for (const token of forbidden) {
    if (text.includes(token)) findings.push(`${file}: content contains forbidden template identity token`);
  }
}

if (findings.length > 0) {
  console.error(["Template leakage check failed:", ...findings.map((finding) => `- ${finding}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Template leakage check passed across ${files.length} ${includeArtifacts ? "source and generated" : "source"} files.`,
  );
}
