import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = dirname(fileURLToPath(import.meta.url));
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
]);
const run = promisify(execFile);
let running = null;
const sendJson = (response, status, data) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(data));
};

createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  try {
    if (path === "/api/veille") {
      if (request.method === "POST") {
        if (!running) running = Promise.allSettled([
          run(process.execPath, [join(base, "veille-monitor.mjs")], { cwd: base, timeout: 180000 }),
          run(process.execPath, [join(base, "flux-monitor.mjs")], { cwd: base, timeout: 60000 }),
          run(process.execPath, [join(base, "taux-monitor.mjs")], { cwd: base, timeout: 30000 }),
        ]).finally(() => { running = null; });
        await running;
      } else if (request.method !== "GET") {
        response.writeHead(405, { Allow: "GET, POST" }).end();
        return;
      }
      const report = JSON.parse(await readFile(join(base, "veille-report.json"), "utf8"));
      sendJson(response, 200, report);
      return;
    }
    if (path === "/api/flux" && request.method === "GET") {
      sendJson(response, 200, JSON.parse(await readFile(join(base, "flux-report.json"), "utf8")));
      return;
    }
    const file = files.get(path);
    if (!file || request.method !== "GET") { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" });
    response.end(await readFile(join(base, file[0])));
  } catch (error) {
    sendJson(response, 503, { error: "Rapport de veille indisponible" });
  }
}).listen(3000, "127.0.0.1", () => console.log("Sahra : http://127.0.0.1:3000"));
