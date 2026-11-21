import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRate, updateRate } from './taux-monitor.mjs';

const now = Date.parse('2026-11-21T19:00:00Z');
const table = (date = '20-11-2026', value = '150.4338') => `<table><tr><th></th><th>${date}</th><th>19-11-2026</th></tr><tr><td>USD</td><td>136.9634</td><td>136.9455</td></tr><tr><td><b>EUR</b></td><td>${value}</td><td>150.4484</td></tr></table>`;
const previous = { rate: 151.688, date: '2026-11-12', source: 'https://www.bank-of-algeria.dz/taux-de-change-journalier/', lastSuccessAt: '2026-11-12T12:00:00Z' };

test('associe le taux EUR à la bonne colonne datée, même si les colonnes sont inversées', () => {
  assert.deepEqual(parseRate(table(), now), { rate: 150.4338, date: '2026-11-20' });
  assert.deepEqual(parseRate(table('18-11-2026', '150,6046'), now), { rate: 150.4484, date: '2026-11-19' });
});
test('refuse une page de blocage, une date future et une valeur incohérente', () => {
  assert.throws(() => parseRate('<html>Access denied EUR 150.5</html>', now));
  assert.throws(() => parseRate(table('23-11-2026'), now));
  assert.throws(() => parseRate(table('20-11-2026', '999'), now));
  assert.throws(() => parseRate(table('31-02-2026'), now));
});
test('actualise le taux et conserve sa date de cotation distincte de la date de collecte', async () => {
  const result = await updateRate(previous, async () => new Response(table()), now);
  assert.equal(result.rate, 150.4338);
  assert.equal(result.date, '2026-11-20');
  assert.equal(result.status, 'ok');
  assert.equal(result.lastSuccessAt, new Date(now).toISOString());
});
test('préserve le dernier taux et son origine après HTTP 403 ou changement de format', async () => {
  for (const response of [new Response('', { status: 403 }), new Response('<html>nouveau format</html>')]) {
    const result = await updateRate(previous, async () => response, now);
    assert.equal(result.status, 'error');
    assert.equal(result.rate, previous.rate);
    assert.equal(result.date, previous.date);
    assert.equal(result.lastSuccessAt, previous.lastSuccessAt);
  }
});
test('ne remplace pas une cotation récente par une ancienne ou une variation suspecte', async () => {
  const recent = { ...previous, rate: 150.4338, date: '2026-11-20' };
  for (const html of [table('18-11-2026'), table('20-11-2026', '300')]) {
    const result = await updateRate(recent, async () => new Response(html), now);
    assert.equal(result.status, 'error');
    assert.equal(result.rate, recent.rate);
  }
});
