import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { selectNews } from "./flux-filters.mjs";

const base = dirname(fileURLToPath(import.meta.url));
const reportFile = process.env.SAHRA_FLUX_REPORT || join(base, "flux-report.json");
const outputFile = process.env.SAHRA_FLUX_OUTPUT || join(base, "flux-data.js");
const mediaUrl = "https://news.google.com/rss/search?q=tourisme+Alg%C3%A9rie&hl=fr&gl=DZ&ceid=DZ:fr";
const topicQueries = {
  technologie: 'Algérie tourisme numérique paiement réservation innovation when:1y',
  commerciale: 'Algérie voyage vol hôtel tarif promotion when:1y',
  societale: 'Algérie visa formalités sécurité voyage when:1y',
};
const socialUrls = [
  "https://mastodon.social/api/v1/timelines/tag/Djanet?limit=40",
  "https://mastodon.social/api/v1/timelines/tag/Algerie?limit=40",
];
const decode = (text) => String(text || "")
  .replace(/<!\[CDATA\[([^]*?)\]\]>/g, "$1")
  .replace(/<[^>]*>/g, " ")
  .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[entity.toLowerCase()] || " ";
  }).replace(/\s+/g, " ").trim();
const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([^]*?)<\\/${name}>`, "i"))?.[1]);
const validUrl = (value) => {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; }
  catch { return null; }
};
const get = async (url, accept) => {
  const response = await fetch(url, { headers: { Accept: accept, "User-Agent": "SahraVeille/1.0" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response;
};
const parseRss = (xml) => [...xml.matchAll(/<item>([^]*?)<\/item>/gi)]
  .map((match) => {
    const rawDate = new Date(tag(match[1], "pubDate"));
    return {
      title: tag(match[1], "title"),
      url: validUrl(tag(match[1], "link")),
      source: tag(match[1], "source") || "Google Actualités",
      publisherUrl: validUrl(decode(match[1].match(/<source\b[^>]*\burl=["']([^"']+)["']/i)?.[1])),
      date: Number.isNaN(rawDate.getTime()) ? null : rawDate.toISOString(),
    };
  })
  .filter((item) => item.title && item.url && item.date);
const newsUrl = (query) => `https://news.google.com/rss/search?${new URLSearchParams({ q: query, hl: "fr", gl: "DZ", ceid: "DZ:fr" })}`;

let previous = { media: { items: [] }, social: { items: [] }, topics: {} };
try { previous = JSON.parse(await readFile(reportFile, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const seenMedia = new Set((previous.media?.items || []).map((item) => item.url));
const seenSocial = new Set((previous.social?.items || []).map((item) => item.url));
const report = { checkedAt: new Date().toISOString(), media: { status: "error", items: selectNews(previous.media?.items || []) }, social: { status: "error", items: previous.social?.items || [] }, topics: {} };

try {
  const xml = await (await get(mediaUrl, "application/rss+xml, application/xml" )).text();
  if (!/<rss\b/i.test(xml)) throw Error("Flux RSS invalide");
  const items = selectNews(parseRss(xml));
  report.media = { status: "ok", items: items.map((item) => ({ ...item, isNew: !seenMedia.has(item.url) && seenMedia.size > 0 })) };
} catch (error) { console.warn(`Médias : ${error.message}`); }

for (const [key, query] of Object.entries(topicQueries)) {
  const oldItems = selectNews(previous.topics?.[key]?.items || [], key);
  const seen = new Set(oldItems.map((item) => item.url));
  try {
    const xml = await (await get(newsUrl(query), "application/rss+xml, application/xml")).text();
    if (!/<rss\b/i.test(xml)) throw Error("Flux RSS invalide");
    const items = selectNews(parseRss(xml), key);
    report.topics[key] = { status: "ok", items: items.map((item) => ({ ...item, isNew: !seen.has(item.url) && seen.size > 0 })) };
  } catch (error) {
    report.topics[key] = { status: "error", items: oldItems };
    console.warn(`${key} : ${error.message}`);
  }
}

try {
  const posts = (await Promise.all(socialUrls.map(async (url) => (await get(url, "application/json")).json()))).flat();
  if (!Array.isArray(posts)) throw Error("Réponse inattendue");
  const items = posts.map((post) => ({
    title: decode(post.content).slice(0, 240),
    url: validUrl(post.url),
    source: post.account?.display_name || post.account?.acct || "Mastodon",
    date: post.created_at,
  })).filter((item) => item.url && /touris|voyag|sahara|djanet|timimoun|tassili/i.test(item.title)
    && Date.now() - new Date(item.date).getTime() < 90 * 24 * 60 * 60 * 1000)
    .filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index)
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  report.social = { status: "ok", items: items.map((item) => ({ ...item, isNew: !seenSocial.has(item.url) && seenSocial.size > 0 })) };
} catch (error) { console.warn(`Réseaux sociaux : ${error.message}`); }

await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
await writeFile(outputFile, `window.sahraFlux = ${JSON.stringify(report).replace(/</g, "\\u003c")};\n`);
console.log(`Médias : ${report.media.status}, ${report.media.items.length} article(s)`);
console.log(`Réseaux sociaux : ${report.social.status}, ${report.social.items.length} publication(s)`);
for (const [key, topic] of Object.entries(report.topics)) console.log(`${key} : ${topic.status}, ${topic.items.length} article(s)`);
if ([report.media, report.social, ...Object.values(report.topics)].every((feed) => feed.status === "error")) process.exitCode = 1;
