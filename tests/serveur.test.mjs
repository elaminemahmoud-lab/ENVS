import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSahraHandler } from '../serveur.mjs';

// Exerce le vrai gestionnaire HTTP sans ouvrir de port réseau.
async function request(handler, url, method = 'GET') {
  const result = { headers: {}, body: null };
  const response = {
    writeHead(status, headers = {}) {
      assert.equal(result.status, undefined, 'une seule réponse HTTP');
      result.status = status;
      result.headers = headers;
      return this;
    },
    end(body) { result.body = body?.toString(); return this; },
  };
  await handler({ url, method }, response);
  return result;
}

test('sert tous les fichiers du navigateur, les rapports actualisables et les API', async () => {
  const html = await readFile(new URL('../site/Sahra.html', import.meta.url), 'utf8');
  const handler = createSahraHandler();
  const assets = [...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map((m) => '/' + m[1]);
  for (const url of ['/', '/Sahra.html', ...assets, '/veille-report.json?t=123', '/flux-report.json', '/taux-report.json', '/api/veille', '/api/flux']) {
    const result = await request(handler, url);
    assert.equal(result.status, 200, url);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.ok(result.body.length > 0, url);
    if (/json|api/.test(url)) assert.ok(JSON.parse(result.body));
  }
  for (const path of ['/.git/config', '/veille-state.json', '/serveur.mjs', '/../PROJET.md', '/inexistant']) {
    assert.equal((await request(handler, path)).status, 404, path);
  }
  assert.equal((await request(handler, '/api/veille', 'DELETE')).status, 405);
});

test('deux contrôles simultanés partagent une collecte et lisent le nouveau rapport', async () => {
  const baseDir = await mkdtemp(join(tmpdir(), 'sahra-http-'));
  try {
    let calls = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const handler = createSahraHandler({ baseDir, collect: async () => {
      calls++;
      await gate;
      await writeFile(join(baseDir, 'veille-report.json'), JSON.stringify({ checkedAt: '2026-11-22T00:00:00Z', sources: [] }));
    } });
    const first = request(handler, '/api/veille', 'POST');
    const second = request(handler, '/api/veille', 'POST');
    release();
    for (const result of await Promise.all([first, second])) {
      assert.equal(result.status, 200);
      assert.equal(JSON.parse(result.body).checkedAt, '2026-11-22T00:00:00Z');
    }
    assert.equal(calls, 1);
    await request(handler, '/api/veille', 'POST');
    assert.equal(calls, 2, 'un contrôle ultérieur doit relancer la collecte');
  } finally { await rm(baseDir, { recursive: true, force: true }); }
});

test('un fichier manquant ou une collecte rejetée renvoie une erreur JSON exploitable', async () => {
  const baseDir = await mkdtemp(join(tmpdir(), 'sahra-http-error-'));
  try {
    const handler = createSahraHandler({ baseDir, collect: async () => { throw Error('indisponible'); } });
    for (const [url, method] of [['/app.js', 'GET'], ['/api/veille', 'POST'], ['/api/veille', 'POST']]) {
      const result = await request(handler, url, method);
      assert.equal(result.status, 503);
      assert.ok(JSON.parse(result.body).error);
    }
  } finally { await rm(baseDir, { recursive: true, force: true }); }
});
