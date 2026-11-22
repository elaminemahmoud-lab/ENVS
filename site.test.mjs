import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

test('recherche, budget limite et liens des sources indépendants des fiches', async () => {
  const elements = new Map();
  const node = (id) => {
    if (!elements.has(id)) elements.set(id, { value: id === '#people' ? '2' : '',
      innerHTML: '', textContent: '', handlers: {},
      addEventListener(event, fn) { this.handlers[event] = fn; },
      scrollIntoView() {}, showModal() {}, close() {},
    });
    return elements.get(id);
  };
  let sourceBindings = 0;
  const sourceLink = { dataset: {}, addEventListener() { sourceBindings++; } };
  const context = vm.createContext({ Intl, window: { sahraRate: { rate: 150.4338, date: '2026-11-20', status: 'ok' } }, document: { querySelector: node,
    querySelectorAll: (selector) => selector === '.detail' ? [sourceLink] : [],
  } });
  vm.runInContext(await readFile(new URL('./app.js', import.meta.url), 'utf8'), context);
  const search = () => node('#form').handlers.submit({ preventDefault() {} });
  node('#place').value = 'Djanet';
  node('#budget').value = '70700';
  search();
  assert.equal(node('#count').textContent, '2 voyages trouvés');
  node('#budget').value = '70699';
  search();
  assert.equal(node('#count').textContent, '0 voyage trouvé');
  node('#place').value = '';
  node('#budget').value = '';
  node('#days').value = '5';
  search();
  assert.equal(node('#count').textContent, '2 voyages trouvés');
  assert.equal(sourceBindings, 0, 'les liens des sources ne doivent pas ouvrir une fiche');
  vm.runInContext('openTrip(4)', context);
  assert.ok(node('#modal').innerHTML.includes('70 700'));
  assert.ok(node('#modal').innerHTML.includes('20 novembre 2026'));
  assert.equal(node('#rateNote').textContent.includes('150,4338'), true);
  assert.doesNotThrow(() => vm.runInContext('openTrip(NaN)', context));
});

test('format CSV en mémoire : domaines, dates, accents, séparateurs et formules', async () => {
  let callback, csv;
  const element = { innerHTML: '', setAttribute() {}, addEventListener(_, fn) { callback = fn; } };
  const report = { checkedAt: '2026-11-21T19:00:00Z', sources: [
    { name: 'Agence; "Été"', group: 'agences', kind: '=TEST', status: 'error', url: 'https://example.com' },
  ] };
  const flux = { checkedAt: report.checkedAt, topics: { societale: { status: 'ok', items: [
    { title: 'Visa; "Algérie"', date: '2026-11-20T12:00:00Z', source: 'Source', url: 'https://example.com/news' },
  ] } } };
  const context = vm.createContext({ window: { sahraVeille: report, sahraFlux: flux }, Intl,
    escapeHtml: String, safeUrl: String, setTimeout() {},
    document: { querySelector: () => element, createElement: () => ({ click() {} }) },
    Blob: class { constructor(parts) { csv = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  });
  vm.runInContext(await readFile(new URL('./strategie.js', import.meta.url), 'utf8'), context);
  callback();
  assert.ok(csv.startsWith('\ufeff"Veille";'));
  assert.ok(csv.includes('"Commerciale";"2026-11-21T19:00:00Z"'));
  assert.ok(csv.includes('"Sociétale";"2026-11-21T19:00:00Z";"2026-11-20T12:00:00Z"'));
  assert.ok(csv.includes('"Agence; ""Été"""'));
  assert.ok(csv.includes('"\'=TEST"'));
  assert.equal(csv.split('\r\n').length, 3);
});

test('veille sans rapport initial et échec HTTP du contrôle : affiche une erreur sans perdre le rapport', async () => {
  const elements = new Map();
  const node = (id) => {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: true, disabled: false,
      handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; },
    });
    return elements.get(id);
  };
  const report = { checkedAt: '2026-11-21T19:00:00Z', sources: [], changes: [] };
  const context = vm.createContext({ window: {}, Intl, URL, location: { protocol: 'http:' },
    document: { querySelector: node, addEventListener() {} }, setInterval() {},
    fetch: async (_, options) => options?.method === 'POST'
      ? { ok: false, status: 503, json: async () => ({ error: 'indisponible' }) }
      : { ok: false },
  });
  vm.runInContext(await readFile(new URL('./veille.js', import.meta.url), 'utf8'), context);
  assert.match(node('#veilleStatus').textContent, /premier contrôle/);
  context.window.sahraVeille = report;
  vm.runInContext('renderVeille(window.sahraVeille)', context);
  await node('#veilleRefresh').handlers.click();
  assert.equal(context.window.currentVeille, report);
  assert.match(node('#veilleStatus').textContent, /échoué/);
  assert.equal(node('#veilleRefresh').disabled, false);
});
