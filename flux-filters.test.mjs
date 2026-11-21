import assert from 'node:assert/strict';
import test from 'node:test';
import { selectNews } from './flux-filters.mjs';

const now = Date.parse('2026-11-21T18:00:00Z');
const item = (title, extra = {}) => ({ title, publisherUrl: 'https://www.aps.dz',
  url: `https://news.google.com/${encodeURIComponent(title)}`,
  date: '2026-11-20T12:00:00Z', ...extra });

test('écarte les faux positifs observés sans perdre les innovations touristiques', () => {
  const good = item('Algérie : nouvelle plateforme de réservation touristique');
  assert.deepEqual(selectNews([
    item('Pneus en Algérie : une plateforme numérique contre la spéculation'),
    item('Algeria Startup Challenge : projets d’innovation ouverte'),
    item('Nouvelle application touristique en Tunisie - Algérie Eco'), good,
  ], 'technologie', now), [good]);
});

test('vérifie le domaine réel de l’éditeur et élimine les doublons', () => {
  const good = item('Air Algérie : promotion sur les vols');
  assert.deepEqual(selectNews([
    item(good.title, { publisherUrl: 'https://horticulture-abadie-pyrenees.com/' }),
    item(good.title, { publisherUrl: 'https://aps.dz.example.com' }),
    item(good.title, { publisherUrl: null }), good, good,
  ], 'commerciale', now), [good]);
});

test('écarte les dates invalides, futures et anciennes, et trie avant de limiter', () => {
  const good = item('Voyage en Algérie : tarifs des hôtels');
  assert.deepEqual(selectNews([
    item(good.title, { date: 'invalide' }),
    item(good.title, { date: '2026-11-22T00:00:00Z' }),
    item(good.title, { date: '2026-07-01T00:00:00Z' }), good,
  ], 'media', now), [good]);
  const many = Array.from({ length: 40 }, (_, n) => item(`Voyage en Algérie ${n}`,
    { date: new Date(now - (40 - n) * 3600000).toISOString() }));
  assert.equal(selectNews(many, 'media', now)[0].title, many[39].title);
  assert.equal(selectNews(many, 'media', now).length, 8);
});
