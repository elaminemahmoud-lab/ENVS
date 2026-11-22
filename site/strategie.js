/* Tableau de bord des quatre veilles et export des observations. */
const strategyTypes = [
  { key: "technologie", number: "01", title: "Technologique", question: "Quelles innovations changent le voyage ?", focus: "Réservation, paiement numérique et outils touristiques.", link: "#references" },
  { key: "concurrence", number: "02", title: "Concurrentielle", question: "Que proposent les autres acteurs ?", focus: "Circuits, nouvelles offres et évolutions des pages concurrentes.", link: "#concurrence" },
  { key: "commerciale", number: "03", title: "Commerciale", question: "Que demandent clients et fournisseurs ?", focus: "Agences, vols, hôtels, prix et attentes des voyageurs.", link: "#agences-locales" },
  { key: "societale", number: "04", title: "Sociétale", question: "Quel contexte influence le départ ?", focus: "Visa, sécurité, culture et conditions de voyage.", link: "#references" },
];

window.renderStrategie = (veilleReport = window.currentVeille || window.sahraVeille, fluxReport = window.currentFlux || window.sahraFlux) => {
  const pages = veilleReport?.sources || [];
  const topics = fluxReport?.topics || {};
  const errors = pages.filter((page) => page.status === "error").length + [fluxReport?.media, fluxReport?.social, ...Object.values(topics)].filter((feed) => feed?.status === "error").length;
  const lastCheck = [veilleReport?.checkedAt, fluxReport?.checkedAt].filter(Boolean).sort().at(-1);
  document.querySelector("#strategieStats").innerHTML = [
    `<div><strong>${pages.length}</strong><span>pages suivies</span></div>`,
    `<div><strong>${Object.keys(topics).length}</strong><span>thèmes d’actualité</span></div>`,
    `<div><strong>${pages.filter((page) => page.status === "changed").length}</strong><span>pages modifiées</span></div>`,
    `<div><strong>${errors}</strong><span>sources ou flux indisponibles</span></div>`,
  ].join("");
  const formatDate = (date) => new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium" }).format(new Date(date));
  document.querySelector("#strategieGrid").innerHTML = strategyTypes.map((type) => {
    const groupPages = pages.filter((page) => page.group === (type.key === "commerciale" ? "agences" : type.key));
    const topic = topics[type.key];
    const articles = topic?.items || [];
    const changed = groupPages.filter((page) => page.status === "changed").length;
    const failed = groupPages.filter((page) => page.status === "error").length;
    const signal = `${groupPages.length} page(s) · ${changed} modifiée(s) · ${failed} inaccessible(s)${type.key === "concurrence" ? "" : ` · ${articles.length} article(s)`}`;
    const articleList = articles.slice(0, type.key === "concurrence" ? 0 : 2).map((item) => `<li><a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a><small>${escapeHtml(item.source)} · ${escapeHtml(formatDate(item.date))} · À vérifier</small></li>`).join("");
    const priorityPages = groupPages.filter((page) => ["changed", "error", "new"].includes(page.status));
    const watchedPages = (priorityPages.length ? priorityPages : groupPages).slice(0, 2).map((page) => `<li><a href="${escapeHtml(safeUrl(page.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.name)}</a><small>${page.status === "changed" ? "Page modifiée · contenu à vérifier" : page.status === "error" ? "Contrôle impossible" : page.status === "new" ? "Premier relevé · référence créée" : "Aucun changement détecté"}</small></li>`).join("");
    const feedWarning = topic?.status === "error" ? '<p class="strategy-warning">Flux indisponible : résultats éventuellement anciens.</p>' : "";
    return `<article class="strategy-card"><div class="strategy-card-top"><span class="strategy-number">${type.number}</span><span class="strategy-signal">${escapeHtml(signal)}</span></div><h3>Veille ${type.title.toLowerCase()}</h3><p class="strategy-question">${escapeHtml(type.question)}</p><p>${escapeHtml(type.focus)}</p><div class="strategy-findings"><b>Éléments du dernier rapport</b>${feedWarning}<ul>${watchedPages + articleList || "<li>Aucun résultat disponible pour le moment.</li>"}</ul></div><a href="${type.link}" class="strategy-more">Explorer les sources →</a></article>`;
  }).join("");
  document.querySelector("#strategieStats").setAttribute("aria-label", lastCheck ? `Dernier contrôle le ${formatDate(lastCheck)}` : "Aucun contrôle enregistré");
  const toReview = [
    ...pages.filter((page) => page.status === "changed").map((page) => `<li><strong>Changement à vérifier :</strong> <a href="${escapeHtml(safeUrl(page.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.name)}</a>. La comparaison porte sur toute la page.</li>`),
    ...pages.filter((page) => page.status === "error").map((page) => `<li><strong>Source indisponible :</strong> <a href="${escapeHtml(safeUrl(page.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.name)}</a>. Consulter la page directement.</li>`),
    ...[["Actualités générales", fluxReport?.media], ["Réseaux sociaux", fluxReport?.social], ...strategyTypes.filter((type) => type.key !== "concurrence").map((type) => [`Actualités ${type.title.toLowerCase()}`, topics[type.key]])].filter(([, feed]) => feed?.status === "error").map(([name]) => `<li><strong>Flux indisponible :</strong> ${escapeHtml(name)}. Les éléments affichés peuvent être anciens.</li>`),
  ];
  document.querySelector("#strategieReview").innerHTML = `<h3>À examiner après le contrôle</h3><p class="note">${lastCheck ? `Dernier contrôle enregistré : ${escapeHtml(formatDate(lastCheck))}.` : "Aucun contrôle enregistré."} Ces signaux ne valident ni une offre ni une information.</p>${toReview.length ? `<ul>${toReview.join("")}</ul>` : "<p>Aucun changement ou échec à examiner dans le dernier rapport.</p>"}`;
};

window.renderStrategie();

document.querySelector("#exportVeilleCsv").addEventListener("click", () => {
  const pages = window.currentVeille?.sources || window.sahraVeille?.sources || [];
  const flux = window.currentFlux || window.sahraFlux || {};
  const names = { technologie: "Technologique", concurrence: "Concurrentielle", agences: "Commerciale", commerciale: "Commerciale", societale: "Sociétale" };
  const checkedAt = window.currentVeille?.checkedAt || window.sahraVeille?.checkedAt || "";
  const rows = [["Veille", "Date du contrôle", "Date du signal", "Source", "Observation", "État", "Lien"]];
  for (const page of pages) rows.push([names[page.group] || page.group, checkedAt, "", page.name, page.kind, page.status, page.url]);
  for (const [key, topic] of Object.entries(flux.topics || {})) {
    for (const item of topic.items || []) rows.push([names[key] || key, flux.checkedAt || "", item.date, item.source, item.title, topic.status === "error" ? "Flux indisponible · ancien résultat possible" : item.isNew ? "Nouveau · à vérifier" : "Repéré · à vérifier", item.url]);
  }
  for (const [key, label] of [["media", "Médias"], ["social", "Réseaux sociaux"]]) {
    const feed = flux[key];
    for (const item of feed?.items || []) rows.push([label, flux.checkedAt || "", item.date, item.source, item.title, feed.status === "error" ? "Flux indisponible · ancien résultat possible" : item.isNew ? "Nouveau · à vérifier" : "Repéré · à vérifier", item.url]);
  }
  const quote = (value) => `"${String(value ?? "").replace(/^[\s\uFEFF]*[=+@-]/, "'$&").replace(/"/g, '""')}"`;
  const csv = "\ufeff" + rows.map((row) => row.map(quote).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `sahra-veille-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
