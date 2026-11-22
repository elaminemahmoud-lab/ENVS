import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const project = dirname(fileURLToPath(import.meta.url));
const base = join(project, "site");
const files = new Map([
  ["/", ["Sahra.html", "text/html; charset=utf-8"]],
  ["/Sahra.html", ["Sahra.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/taux-data.js", ["taux-data.js", "text/javascript; charset=utf-8"]],
  ["/veille.js", ["veille.js", "text/javascript; charset=utf-8"]],
  ["/veille-data.js", ["veille-data.js", "text/javascript; charset=utf-8"]],
  ["/flux.js", ["flux.js", "text/javascript; charset=utf-8"]],
  ["/flux-data.js", ["flux-data.js", "text/javascript; charset=utf-8"]],
  ["/strategie.js", ["strategie.js", "text/javascript; charset=utf-8"]],
  ["/veille-report.json", ["veille-report.json", "application/json; charset=utf-8"]],
  ["/flux-report.json", ["flux-report.json", "application/json; charset=utf-8"]],
  ["/taux-report.json", ["taux-report.json", "application/json; charset=utf-8"]],
]);
const run = promisify(execFile);
const sendJson = (response, status, data) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(data));
};

export function createSahraHandler({ baseDir = base, collect = () => Promise.allSettled([
  run(process.execPath, [join(project, "scripts", "veille-monitor.mjs")], { cwd: baseDir, timeout: 300000 }),
  run(process.execPath, [join(project, "scripts", "flux-monitor.mjs")], { cwd: baseDir, timeout: 90000 }),
  run(process.execPath, [join(project, "scripts", "taux-monitor.mjs")], { cwd: baseDir, timeout: 30000 }),
]) } = {}) {
  let running = null;
  return async (request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    try {
      if (path === "/api/veille") {
        if (request.method === "POST") {
          if (!running) running = Promise.resolve().then(collect).finally(() => { running = null; });
          await running;
        } else if (request.method !== "GET") {
          response.writeHead(405, { Allow: "GET, POST" }).end();
          return;
        }
        const report = JSON.parse(await readFile(join(baseDir, "veille-report.json"), "utf8"));
        sendJson(response, 200, report);
        return;
      }
      if (path === "/api/flux" && request.method === "GET") {
        sendJson(response, 200, JSON.parse(await readFile(join(baseDir, "flux-report.json"), "utf8")));
        return;
      }
      const file = files.get(path);
      if (!file || request.method !== "GET") { response.writeHead(404).end(); return; }
      const content = await readFile(join(baseDir, file[0]));
      response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" });
      response.end(content);
    } catch (error) {
      sendJson(response, 503, { error: "Rapport de veille indisponible" });
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer(createSahraHandler()).listen(3000, "127.0.0.1", () => console.log("Sahra : http://127.0.0.1:3000"));
}
