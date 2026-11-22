import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const rateSource = 'https://www.bank-of-algeria.dz/taux-de-change-journalier/';
const plain = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|#160|#xA0);/gi, ' ').replace(/\s+/g, ' ').trim();
export function parseRate(html, now = Date.now()) {
  const found = [];
  for (const table of html.matchAll(/<table\b[^>]*>([^]*?)<\/table>/gi)) {
    const rows = [...table[1].matchAll(/<tr\b[^>]*>([^]*?)<\/tr>/gi)]
      .map((row) => [...row[1].matchAll(/<t[hd]\b[^>]*>([^]*?)<\/t[hd]>/gi)].map((cell) => plain(cell[1])));
    const dates = new Map();
    for (const row of rows) row.forEach((cell, col) => {
      const match = cell.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
      if (!match) return;
      const [, d, m, y] = match;
      const iso = `${y}-${m}-${d}`;
      if (new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso) throw Error('Date invalide');
      if (Date.parse(`${iso}T00:00:00Z`) > now) throw Error('Cotation future');
      dates.set(col, iso);
    });
    for (const row of rows) {
      if (!row.some((cell) => cell === 'EUR')) continue;
      for (const [col, date] of dates) {
        const value = row[col]?.replace(/\s/g, '');
        if (!/^\d{2,3}(?:[.,]\d{1,6})?$/.test(value || '')) continue;
        const rate = Number(value.replace(',', '.'));
        if (rate < 50 || rate > 500) throw Error('Taux hors limites');
        found.push({ rate, date });
      }
    }
  }
  if (!found.length) throw Error('Tableau EUR daté introuvable');
  found.sort((a, b) => b.date.localeCompare(a.date));
  if (found.some((entry) => entry.date === found[0].date && entry.rate !== found[0].rate)) throw Error('Cotations contradictoires');
  return found[0];
}

export async function updateRate(previous, get = fetch, now = Date.now()) {
  const checkedAt = new Date(now).toISOString();
  try {
    const response = await get(rateSource, { headers: { Accept: 'text/html', 'User-Agent': 'SahraVeille/1.0' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const next = parseRate(await response.text(), now);
    if (next.date < previous.date) throw Error('Cotation antérieure au taux enregistré');
    if (Math.abs(next.rate / previous.rate - 1) > 0.2) throw Error('Variation de plus de 20 % à vérifier');
    return { ...next, source: rateSource, checkedAt, lastSuccessAt: checkedAt, status: 'ok' };
  } catch (error) {
    console.warn(`Taux EUR/DZD : ${error.message}. Dernier taux conservé.`);
    return { ...previous, checkedAt, status: 'error', error: error.message };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
  const reportPath = process.env.SAHRA_RATE_REPORT || join(base, 'taux-report.json');
  const outputPath = process.env.SAHRA_RATE_OUTPUT || join(base, 'taux-data.js');
  const previous = JSON.parse(await readFile(reportPath, 'utf8'));
  if (!(previous.rate >= 50 && previous.rate <= 500) || !/^\d{4}-\d{2}-\d{2}$/.test(previous.date)) throw Error('Taux de secours invalide');
  const report = await updateRate(previous);
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  await writeFile(outputPath, `window.sahraRate = ${JSON.stringify(report).replace(/</g, '\\u003c')};\n`);
  console.log(`1 EUR = ${report.rate} DZD ; cotation du ${report.date} ; état ${report.status}`);
  if (report.status === 'error') process.exitCode = 1;
}
