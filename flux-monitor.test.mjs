import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { selectSocial } from './flux-filters.mjs';

const now = Date.parse('2026-11-22T00:00:00Z');
const item = (name, days = 1, extra = {}) => ({ title: `Voyage Djanet ${name}`, url: `https://mastodon.social/@test/${name}`, date: new Date(now - days * 86400000).toISOString(), ...extra });

test('publications sociales : exclut les dates futures, invalides, anciennes, liens dangereux et doublons', () => {
  const valid = item('valide');
  assert.deepEqual(selectSocial([
    item('ancien', 91), item('futur', -1), item('invalide', 1, { date: 'invalide' }),
    item('dangereux', 1, { url: 'javascript:alert(1)' }), item('hors-sujet', 1, { title: 'Bonjour' }), valid, valid,
  ], now), [valid]);
  const many = Array.from({ length: 20 }, (_, index) => item(String(index), index));
  assert.equal(selectSocial(many.reverse(), now).length, 8);
  assert.equal(selectSocial(many, now)[0].title, 'Voyage Djanet 0');
});

test('le moniteur filtre les publications reçues puis celles conservées après échec', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sahra-flux-'));
  try {
    const report = join(dir, 'report.json');
    const output = join(dir, 'data.js');
    const preload = join(dir, 'fetch.mjs');
    const mode = join(dir, 'mode.txt');
    const script = fileURLToPath(new URL('./flux-monitor.mjs', import.meta.url));
    await writeFile(mode, 'ok');
    await writeFile(preload, `import { readFile } from 'node:fs/promises';
      globalThis.fetch = async (url) => {
        const mode = await readFile(${JSON.stringify(mode)}, 'utf8');
        if (mode === 'fail') return new Response('', { status: 503 });
        if (url.includes('news.google.com')) return new Response('<rss><channel></channel></rss>');
        if (mode === 'invalid') return Response.json({ error: 'not an array' });
        return Response.json([
          { content: '<p>Voyage Djanet</p>', url: 'https://mastodon.social/@test/valid', created_at: new Date(Date.now() - 86400000).toISOString() },
          { content: 'Voyage Djanet futur', url: 'https://mastodon.social/@test/future', created_at: new Date(Date.now() + 86400000).toISOString() }
        ]);
      };`);
    const run = () => promisify(execFile)(process.execPath, ['--import', pathToFileURL(preload).href, script], {
      env: { ...process.env, SAHRA_FLUX_REPORT: report, SAHRA_FLUX_OUTPUT: output },
    });
    await run();
    const collected = JSON.parse(await readFile(report, 'utf8'));
    assert.equal(collected.social.status, 'ok');
    assert.equal(collected.social.items.length, 1, 'doublon entre hashtags éliminé');
    collected.social.items.push({ ...collected.social.items[0], url: 'https://mastodon.social/@test/old', date: new Date(Date.now() - 91 * 86400000).toISOString() });
    await writeFile(report, JSON.stringify(collected));
    await writeFile(mode, 'fail');
    await assert.rejects(run);
    const fallback = JSON.parse(await readFile(report, 'utf8'));
    assert.equal(fallback.social.status, 'error');
    assert.equal(fallback.social.items.length, 1, 'ancienne publication supprimée même hors réseau');
    await writeFile(mode, 'invalid');
    await run();
    assert.equal(JSON.parse(await readFile(report, 'utf8')).social.status, 'error');
    const js = await readFile(output, 'utf8');
    assert.deepEqual(JSON.parse(js.replace(/^window\.sahraFlux = /, '').trim().replace(/;$/, '')), JSON.parse(await readFile(report, 'utf8')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
