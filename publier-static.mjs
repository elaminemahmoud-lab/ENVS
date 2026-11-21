/* Prépare le site public sans les scripts de collecte ni leur état interne. */
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = dirname(fileURLToPath(import.meta.url));
const output = join(base, "dist");
for (const name of ["veille-report.json", "flux-report.json"]) {
  const report = JSON.parse(await readFile(join(base, name), "utf8"));
  if (!report.checkedAt || !Number.isFinite(Date.parse(report.checkedAt))) {
    throw new Error(`Rapport sans date de contrôle valide : ${name}`);
  }
}
await mkdir(output, { recursive: true });
await copyFile(join(base, "Sahra.html"), join(output, "index.html"));
for (const name of ["Sahra.html", "style.css", "app.js", "veille-data.js", "veille.js",
  "flux-data.js", "flux.js", "strategie.js", "veille-report.json", "flux-report.json", "taux-data.js", "taux-report.json"]) {
  await copyFile(join(base, name), join(output, name));
}
console.log("Site prêt dans dist/ pour GitHub Pages.");
