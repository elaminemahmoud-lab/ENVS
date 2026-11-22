/* Offres, filtres, calcul des prix et fiches de voyage. */
const trips = [
  {
    id: 1,
    title: "Timimoun, la perle rouge",
    place: "Timimoun",
    type: "Sahara",
    days: 4,
    price: 345,
    agency: "Ziguade Travel",
    summary:
      "4 jours au départ d’Alger. Le départ du 21 au 24 décembre 2026 est annoncé complet ; demander une autre date à l’agence. Tarif publié à titre de référence.",
    route: "Alger → Timimoun → Alger",
    included: [
      "Vol aller-retour",
      "Pension complète",
      "Maison d’hôte",
      "Excursions",
    ],
    source: "https://ziguadetravel.com/",
    contact: "https://ziguadetravel.com/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Timimoun.jpg?width=800",
  },
  {
    id: 2,
    title: "El Menia, trésor du Sahara",
    place: "El Menia",
    type: "Sahara",
    days: 4,
    price: 330,
    agency: "Ziguade Travel",
    summary:
      "Séjour de 4 jours et 3 nuits au départ d’Alger. Départ annoncé du 19 au 22 décembre 2026.",
    route: "Alger → El Menia → Alger",
    included: [
      "Vol aller-retour",
      "Pension complète",
      "Maison d’hôte",
      "Excursions",
    ],
    source: "https://ziguadetravel.com/",
    contact: "https://ziguadetravel.com/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/El%20Menia%2001.jpg?width=800",
  },
  {
    id: 3,
    title: "Ghardaïa, El Menia et Timimoun",
    place: "Ghardaïa",
    type: "Sahara",
    days: 8,
    price: 690,
    agency: "Ziguade Travel",
    summary:
      "Circuit de 8 jours et 7 nuits. Départs annoncés du 3 au 10 décembre 2026 et du 7 au 14 janvier 2027.",
    route: "Alger → Ghardaïa → El Menia → Timimoun",
    included: [
      "Vol aller-retour",
      "Pension complète",
      "Maison d’hôte",
      "Excursions",
    ],
    source: "https://ziguadetravel.com/",
    contact: "https://ziguadetravel.com/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ghardaia01.jpg?width=800",
  },
  {
    id: 4,
    title: "Djanet et la Tadrart rouge",
    place: "Djanet",
    type: "Sahara",
    days: 7,
    price: 470,
    agency: "Ziguade Travel",
    summary:
      "Circuit en bivouac au départ d’Alger. Plusieurs départs annoncés entre novembre 2026 et mars 2027.",
    route: "Alger → Djanet → Tadrart rouge",
    included: ["Vol aller-retour", "Pension complète", "Bivouac", "Excursions"],
    source: "https://ziguadetravel.com/",
    contact: "https://ziguadetravel.com/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Tadrart%20Rouge.jpg?width=800",
  },
  {
    id: 5,
    title: "Djanet et les oasis",
    place: "Djanet",
    type: "Sahara",
    days: 7,
    price: 470,
    agency: "Ziguade Travel",
    summary:
      "Circuit de 7 jours à 470 € : départs annoncés en janvier et février 2027. Variante du 19 au 26 décembre 2026 : 8 jours à 490 € par personne. Places à confirmer.",
    route: "Alger → Djanet → Ihrir → Essendilène → Tikoubaouine",
    included: ["Vol aller-retour", "Pension complète", "Bivouac", "Excursions"],
    source: "https://ziguadetravel.com/",
    contact: "https://ziguadetravel.com/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ihrir%20djanet.jpg?width=800",
  },
  {
    id: 6,
    title: "Alger la Blanche et Tipaza",
    place: "Alger",
    type: "Culture",
    days: 7,
    price: 1560,
    agency: "Agence locale de Sofiane via Evaneos",
    summary:
      "Voyage personnalisable à Alger, Tipaza et Chréa. Tarif par personne calculé pour un groupe de deux, hors vols internationaux.",
    route: "Alger → Casbah → Tipaza → Chréa",
    included: [
      "Itinéraire personnalisable",
      "Agence locale",
      "Visites culturelles",
    ],
    source:
      "https://www.evaneos.fr/algerie/itineraire/26823-alger-la-blanche-et-escale-a-tipaza/",
    contact:
      "https://www.evaneos.fr/algerie/itineraire/26823-alger-la-blanche-et-escale-a-tipaza/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Casbah%20of%20Algiers.jpg?width=800",
  },
  {
    id: 7,
    title: "Circuit culturel Oran et Alger",
    place: "Oran",
    type: "Culture",
    days: 9,
    price: 1895,
    agency: "Algérie Tours",
    summary:
      "Oran, Tlemcen, Alger, Tipaza et Cherchell. Tarif de base pour quatre participants ; supplément possible pour deux.",
    route: "Oran → Tlemcen → Alger → Tipaza → Cherchell",
    included: [
      "Guide francophone",
      "Hôtels 3 étoiles",
      "Pension complète",
      "Vol aller-retour depuis la France",
    ],
    source: "https://www.algerie-tours.com/circuit-culturel-oran-et-alger/",
    contact: "https://www.algerie-tours.com/circuit-culturel-oran-et-alger/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Vue%20d%27Oran%2001.jpg?width=800",
  },
  {
    id: 8,
    title: "Trésors de l’Est algérien",
    place: "Constantine",
    type: "Culture",
    days: 10,
    price: 2270,
    agency: "Agence locale de Sofiane via Evaneos",
    summary:
      "Alger, Constantine, les sites romains et les Aurès. Tarif par personne calculé pour un groupe de deux, hors vols internationaux.",
    route: "Alger → Sétif → Djémila → Constantine → Timgad → Biskra",
    included: [
      "Itinéraire personnalisable",
      "Agence locale",
      "Visites culturelles",
    ],
    source:
      "https://www.evaneos.fr/algerie/itineraire/26746-tresors-du-passe-et-rencontres-dans-l-est-algerien/",
    contact:
      "https://www.evaneos.fr/algerie/itineraire/26746-tresors-du-passe-et-rencontres-dans-l-est-algerien/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Constantine%20bridge.jpg?width=800",
  },
  {
    id: 9,
    title: "Villes romaines et oasis de Ghardaïa",
    place: "Constantine",
    type: "Culture",
    days: 10,
    price: 2095,
    agency: "Algérie Tours",
    summary:
      "Circuit culturel de dix jours. Offre annoncée pour un groupe d’au moins dix participants, avec vols depuis la France. Pour un autre effectif, demander un devis.",
    route: "Alger → Tipaza → Djémila → Constantine → Timgad → Ghardaïa",
    included: ["Guide accompagnateur", "Hôtels 4 étoiles", "Pension complète", "Vol aller-retour depuis la France"],
    source:
      "https://www.algerie-tours.com/circuit-les-villes-romaines-dalgerie-loasis-de-ghardaia/",
    contact:
      "https://www.algerie-tours.com/circuit-les-villes-romaines-dalgerie-loasis-de-ghardaia/",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ghardaia01.jpg?width=800",
  },
];
const savedRate = typeof window !== "undefined" ? window.sahraRate : null;
const rateInfo = savedRate && Number.isFinite(savedRate.rate) && savedRate.rate >= 50 && savedRate.rate <= 500
  && /^\d{4}-\d{2}-\d{2}$/.test(savedRate.date) && Number.isFinite(Date.parse(savedRate.date))
  ? savedRate : { rate: 151.688, date: "2026-11-12", status: "reference" };
const rate = rateInfo.rate;
const rateDescription = () => {
  const date = new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "long" }).format(new Date(`${rateInfo.date}T12:00:00Z`));
  const value = new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 4 }).format(rate);
  const ageDays = (Date.now() - Date.parse(`${rateInfo.date}T00:00:00Z`)) / 86400000;
  return `Conversion indicative : 1 € = ${value} DZD, cotation Banque d’Algérie du ${date}. `
    + (rateInfo.status === "ok" ? "Actualisation automatique active. " : rateInfo.status === "error" ? "Dernière récupération impossible : taux précédent conservé. " : "Taux de référence conservé, en attente d’une récupération automatique. ")
    + (ageDays > 7 ? "Cette cotation date de plus de sept jours. " : "")
    + "Les frais et le taux appliqués au paiement peuvent différer.";
};
const rateNote = document.querySelector("#rateNote");
if (rateNote) rateNote.textContent = rateDescription();
const dzd = (n) => Math.round((n * rate) / 100) * 100;
const fmt = (n) => new Intl.NumberFormat("fr-DZ").format(n);
const priceConditions = (trip) => [6, 8].includes(trip.id)
  ? "Tarif par personne sur la base de deux voyageurs, hors vols internationaux."
  : trip.id === 7 ? "Tarif par personne sur une base de quatre participants ; dès deux avec supplément. Vols depuis la France inclus."
  : trip.id === 9 ? "Tarif par personne pour un groupe annoncé de dix participants ou plus. Vols depuis la France inclus."
  : "Tarif publié par personne au départ d’Alger ; dates et places à confirmer.";
let shown = trips;
const cards = document.querySelector("#cards");
function render(list) {
  shown = list;
  document.querySelector("#count").textContent =
    list.length +
    " voyage" +
    (list.length > 1 ? "s" : "") +
    " trouvé" +
    (list.length > 1 ? "s" : "");
  cards.innerHTML = list.length
    ? list
        .map(
          (t) =>
            `<article class="card"><div class="photo" style="background-image:url('${t.image}')"><span class="tag">${t.type} · ${t.days} jours</span></div><div class="body"><div class="loc">${t.place}</div><h3>${t.title}</h3><a class="meta" href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(decodeURIComponent(t.image.split("/").pop().split("?")[0]))}" target="_blank" rel="noopener noreferrer">Crédit photo ↗</a><div class="meta">Proposé par ${t.agency}</div><p class="desc">${t.summary}</p><div class="bottom"><div class="price"><strong>${fmt(dzd(t.price))} DZD</strong><small>≈ ${fmt(t.price)} € / personne</small></div><button class="detail" data-id="${t.id}">Voir le voyage</button></div></div></article>`,
        )
        .join("")
    : `<div class="empty"><h3>Aucun voyage ne correspond à ces critères.</h3><p>Essayez un budget plus élevé, une durée plus longue ou une autre destination.</p><button id="reset">Effacer les filtres</button></div>`;
  document.querySelector("#reset")?.addEventListener("click", () => {
    document.querySelector("#form").reset();
    render(trips);
  });
  document
    .querySelectorAll("#cards button.detail[data-id]")
    .forEach((b) => b.addEventListener("click", () => openTrip(+b.dataset.id)));
}
function openTrip(id) {
  const t = trips.find((x) => x.id === id);
  if (!t) return;
  document.querySelector("#modal").innerHTML =
    `<button class="close" aria-label="Fermer">×</button><div class="loc">${t.place} · ${t.type}</div><h2>${t.title}</h2><p>${t.summary}</p><p><b>Itinéraire :</b> ${t.route}</p><p><b>Durée :</b> ${t.days} jours &nbsp; <b>À partir de :</b> ${fmt(t.price)} € par personne (≈ ${fmt(dzd(t.price))} DZD)</p><p>${priceConditions(t)}</p><p><b>Estimation pour votre groupe :</b> ${fmt(dzd(t.price) * (+document.querySelector("#people").value || 1))} DZD. Simple multiplication du tarif de référence, hors suppléments ; devis nécessaire selon l’effectif et les dates.</p><p class="meta">Prix et programme consultés le 21 novembre 2026. La veille automatique ne vérifie pas les places disponibles.</p><h3>Prestations et programme annoncés</h3><div>${t.included.map((x) => `<span class="badge">${x}</span>`).join("")}</div><h3>Agence organisatrice</h3><p><b>${t.agency}</b> · Agence réelle · voir la source officielle</p><p class="warn">${rateDescription()} Le tarif de l’agence reste en euros ; confirmez le montant et les places auprès d’elle.</p><a class="contact" href="${t.contact}" target="_blank" rel="noopener noreferrer">Contacter l'agence ↗</a> <a href="${t.source}" target="_blank" rel="noopener noreferrer">Voir la source</a>`;
  document.querySelector("#dialog").showModal();
  document.querySelector(".close").onclick = () =>
    document.querySelector("#dialog").close();
}
document.querySelector("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  let p = document.querySelector("#place").value,
    ty = document.querySelector("#type").value,
    b = +document.querySelector("#budget").value,
    d = +document.querySelector("#days").value;
  let result = trips.filter(
    (t) =>
      (!p || t.place === p) &&
      (!ty || t.type === ty) &&
      (!b || dzd(t.price) <= b) &&
      (!d || t.days <= d),
  );
  render(result);
  document.querySelector("#voyages").scrollIntoView({ behavior: "smooth" });
});
render(trips);
