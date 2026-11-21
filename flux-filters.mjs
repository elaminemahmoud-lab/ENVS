// Filtre éditorial explicite : cette sélection ne garantit pas les articles.
const publishers = [
  'aps.dz', 'voyagerdz.com', 'algerie360.com', 'algerie-eco.com',
  'visa-algerie.com', 'tsa-algerie.com', 'elwatan.com', 'elwatan-dz.com',
  'geo.fr', 'ouest-france.fr', 'lemonde.fr', 'franceinfo.fr',
  'radioalgerie.dz', 'news.radioalgerie.dz', 'webdo.tn', 'tourmag.com',
];
const normalize = (value) => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const geography = /\b(algerie|algeriens?|algeriennes?|alger|djanet|timimoun|tassili|ghardaia|oran|tlemcen|bejaia|constantine)\b/;
const travel = /\b(touris\w*|voyag\w*|sejours?|circuits?|vols?|hotels?|aeroports?|aeriens?|aeriennes?|air algerie|visa|visas|passeports?|frontieres?|randonne\w*|trek\w*|hebergement\w*)\b/;
const topics = {
  technologie: /numerique|digital|paiement|reservation|intelligence artificielle|innovation|application|plateforme/,
  commerciale: /prix|tarif|vols?|hotels?|voyage|promotion|tourisme|reservation/,
  societale: /visa|securite|formalites|frontiere|greve|transport|passeport|conseils aux voyageurs/,
};

export function selectNews(items, topic = 'media', now = Date.now()) {
  const seen = new Set();
  return items.filter((item) => {
    let host;
    try { host = new URL(item.publisherUrl).hostname.toLowerCase(); }
    catch { return false; }
    if (!publishers.some((domain) => host === domain || host.endsWith(`.${domain}`))) return false;
    // Le nom de l'éditeur ne doit pas rendre un titre hors sujet pertinent.
    const title = normalize(item.title).split(/\s[-–—]\s/)[0];
    const age = now - Date.parse(item.date);
    if (!Number.isFinite(age) || age < 0 || age > 90 * 86400000) return false;
    if (!geography.test(title) || !travel.test(title)) return false;
    if (topic !== 'media' && !topics[topic]?.test(title)) return false;
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, topic === 'media' ? 8 : 6);
}
