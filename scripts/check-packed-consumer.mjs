import { execFile } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packages = [
  "@resume-agent/contracts",
  "@resume-agent/profile",
  "@resume-agent/widget",
  "@resume-agent/mcp",
  "@resume-agent/gateway",
  "@resume-agent/runtime",
];
const temporaryRoot = await mkdtemp(join(tmpdir(), "resume-agent-consumer-"));
const tarballDirectory = join(temporaryRoot, "tarballs");
const consumerDirectory = join(temporaryRoot, "consumer");
const npmEnvironment = {
  ...process.env,
  npm_config_cache: join(tmpdir(), "resume-agent-npm-cache"),
};

try {
  await mkdir(tarballDirectory);
  await mkdir(consumerDirectory);
  const tarballs = [];
  for (const packageName of packages) {
    const { stdout } = await execFileAsync(
      "npm",
      ["pack", "--silent", "--json", "--pack-destination", tarballDirectory, "-w", packageName],
      { cwd: process.cwd(), env: npmEnvironment },
    );
    const result = JSON.parse(stdout);
    const filename = result[0]?.filename;
    if (typeof filename !== "string") throw new Error(`npm pack did not return a filename for ${packageName}.`);
    tarballs.push(join(tarballDirectory, filename));
  }

  const browserBundle = await readFile("packages/widget/dist/resume-agent.js", "utf8");
  for (const forbidden of ["@resume-agent/", "node:", "OPENAI_API_KEY", "MCP_SERVICE_TOKEN"]) {
    if (browserBundle.includes(forbidden)) {
      throw new Error(`Widget browser bundle contains forbidden token: ${forbidden}`);
    }
  }

  await writeFile(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "resume-agent-clean-consumer", private: true, type: "module" }),
  );
  await execFileAsync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      ...tarballs,
    ],
    { cwd: consumerDirectory, env: npmEnvironment, maxBuffer: 16 * 1024 * 1024 },
  );
  await access(join(consumerDirectory, "node_modules", ".bin", "resume-agent-runtime"));
  await writeFile(
    join(consumerDirectory, "verify.mjs"),
    [
      'await import("@resume-agent/contracts");',
      'await import("@resume-agent/profile");',
      'await import("@resume-agent/widget");',
      'await import("@resume-agent/mcp");',
      'await import("@resume-agent/gateway");',
      'await import("@resume-agent/runtime");',
      'console.log("Clean packed consumer imports passed.");',
    ].join("\n"),
  );
  const { stdout } = await execFileAsync(
    process.execPath,
    ["verify.mjs"],
    { cwd: consumerDirectory },
  );
  process.stdout.write(stdout);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
