import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function collect(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && [".git", ".next", ".omx", "dist", "node_modules"].includes(entry.name)) {
      continue;
    }
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(child)));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) files.push(child);
  }
  return files;
}

const browserPackages = new Set(["contracts", "profile", "widget"]);
const files = await collect(".");
const findings = [];

for (const file of files) {
  if (file.includes("node_modules") || file.includes("/dist/") || /\.test\.[^.]+$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  const packageName = file.match(/^packages\/([^/]+)\//)?.[1];
  if (
    packageName
    && browserPackages.has(packageName)
    && /(?:from|import)\s*\(?\s*["'](?:node:|next(?:\/|["']))/.test(source)
  ) {
    findings.push(`${file}: browser-safe package imports a Node.js or Next.js module`);
  }
  if (/@resume-agent\/[^"']+\/(?:src|dist)(?:\/|["'])/.test(source)) {
    findings.push(`${file}: deep-imports another workspace package`);
  }
}

if (findings.length > 0) {
  console.error(["Package boundary check failed:", ...findings.map((finding) => `- ${finding}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Package boundary check passed across ${files.length} TypeScript files.`);
}
