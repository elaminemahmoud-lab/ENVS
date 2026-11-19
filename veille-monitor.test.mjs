import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

test("premier relevé, changement et échec conservent la référence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sahra-veille-"));
  let page = "Voyage dans le Sahara avec départ en janvier et guide local.".repeat(3);
  try {
    const source = join(dir, "sources.json");
    const state = join(dir, "state.json");
    const output = join(dir, "data.js");
    const report = join(dir, "report.json");
    await writeFile(source, JSON.stringify([{ name: "Test", kind: "Circuit", url: `https://example.com/` }]));
    const fixture = join(dir, "page.html");
    await writeFile(fixture, `<html><body><main>${page}</main></body></html>`);
    // Le préchargeur fournit une page locale pour tester la comparaison hors réseau.
    const preload = join(dir, "fetch.mjs");
    await writeFile(preload, `import { readFile } from "node:fs/promises"; globalThis.fetch = async () => { const text = await readFile(${JSON.stringify(fixture)}, "utf8"); return new Response(text, { status: text === "FAIL" ? 503 : 200 }); };`);
    const script = join(dirname(fileURLToPath(import.meta.url)), "veille-monitor.mjs");
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const runAsync = promisify(execFile);
    const check = async () => {
      await runAsync(process.execPath, ["--import", pathToFileURL(preload).href, script], {
        env: { ...process.env, SAHRA_SOURCES: source, SAHRA_STATE: state, SAHRA_OUTPUT: output, SAHRA_REPORT: report },
      });
      return JSON.parse((await readFile(output, "utf8")).replace(/^window\.sahraVeille = /, "").trim().replace(/;$/, ""));
    };
    assert.equal((await check()).sources[0].status, "new");
    assert.equal((await check()).sources[0].status, "unchanged");
    page += " Nouveau départ annoncé.";
    await writeFile(fixture, `<html><body><main>${page}</main></body></html>`);
    const changed = await check();
    assert.equal(changed.sources[0].status, "changed");
    assert.equal(changed.changes.length, 1);
    const before = JSON.parse(await readFile(state, "utf8")).pages["https://example.com/"].hash;
    await writeFile(fixture, "FAIL");
    await assert.rejects(check);
    const after = JSON.parse(await readFile(state, "utf8")).pages["https://example.com/"].hash;
    assert.equal(after, before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
