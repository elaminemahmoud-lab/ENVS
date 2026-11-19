import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = dirname(fileURLToPath(import.meta.url));
const sourcesFile = process.env.SAHRA_SOURCES || join(base, "veille-sources.json");
const stateFile = process.env.SAHRA_STATE || join(base, "veille-state.json");
const outputFile = process.env.SAHRA_OUTPUT || join(base, "veille-data.js");
const reportFile = process.env.SAHRA_REPORT || join(base, "veille-report.json");
const sources = JSON.parse(await readFile(sourcesFile, "utf8"));
let previous = { pages: {}, changes: [] };
try { previous = JSON.parse(await readFile(stateFile, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }

function normalizedText(html) {
  return html
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<(script|style|svg|noscript)\b[^>]*>[^]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const checkedAt = new Date().toISOString();
const pages = { ...previous.pages };
const changes = [...(previous.changes || [])];
const results = [];
for (const source of sources) {
  if (!/^https:\/\//.test(source.url)) throw new Error(`URL HTTPS requise : ${source.name}`);
  let status = "error";
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "SahraVeille/1.0 (+site de découverte touristique)", Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = normalizedText(await response.text());
    if (text.length < 80) throw new Error("Contenu trop court");
    const hash = createHash("sha256").update(text).digest("hex");
    const old = pages[source.url];
    status = !old ? "new" : old.hash === hash ? "unchanged" : "changed";
    pages[source.url] = { hash, checkedAt };
    if (status === "changed") changes.unshift({ name: source.name, url: source.url, at: checkedAt });
  } catch (error) {
    console.warn(`${source.name}: ${error.message}`);
  }
  results.push({ ...source, status });
  console.log(`${source.name}: ${status}`);
}

const report = { checkedAt, sources: results, changes: changes.slice(0, 30) };
await writeFile(stateFile, JSON.stringify({ pages, changes: report.changes }, null, 2) + "\n");
await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
await writeFile(outputFile, `window.sahraVeille = ${JSON.stringify(report).replace(/</g, "\\u003c")};\n`);
if (results.every((result) => result.status === "error")) process.exitCode = 1;
