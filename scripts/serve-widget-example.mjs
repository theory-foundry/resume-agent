import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const repositoryRoot = resolve(process.cwd());
const host = "127.0.0.1";
const port = Number.parseInt(process.env.WIDGET_EXAMPLE_PORT ?? "4173", 10);
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${host}:${port}`).pathname;
  const requested = pathname === "/"
    ? "/examples/plain-html/index.html"
    : pathname.endsWith("/")
      ? `${pathname}index.html`
      : pathname;
  const file = resolve(repositoryRoot, `.${decodeURIComponent(requested)}`);
  if (file !== repositoryRoot && !file.startsWith(`${repositoryRoot}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "content-type": contentTypes.get(extname(file)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Widget example: http://${host}:${port}/examples/plain-html/`);
});
