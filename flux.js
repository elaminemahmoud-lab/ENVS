/* Articles et publications publiques issus du dernier contrôle. */
function renderFlux(report) {
  window.currentFlux = report;
  for (const [key, statusId, resultsId] of [
    ["media", "mediaStatus", "mediaResults"],
    ["social", "socialStatus", "socialResults"],
  ]) {
    const feed = report?.[key] || { status: "pending", items: [] };
    const status = document.querySelector(`#${statusId}`);
    status.textContent = feed.status === "error"
      ? "Source indisponible lors du dernier contrôle ; les éléments affichés peuvent être anciens."
      : report?.checkedAt
        ? `Dernier contrôle : ${new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt))} · ${feed.items.length} résultat(s).`
        : "En attente du premier contrôle.";
    document.querySelector(`#${resultsId}`).innerHTML = feed.items.length
      ? feed.items.map((item) => `<article class="card"><div class="body"><div class="loc">${escapeHtml(item.source)}${item.isNew ? " · Nouveau" : ""}</div><h3>${escapeHtml(item.title)}</h3><p class="desc">${escapeHtml(new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium" }).format(new Date(item.date)))}</p><div class="bottom"><a class="detail" href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Lire à la source ↗</a></div></div></article>`).join("")
      : '<div class="empty"><p>Aucun résultat pertinent pour le moment.</p></div>';
  }
  window.renderStrategie?.(window.currentVeille || window.sahraVeille, report);
}
renderFlux(window.sahraFlux);
async function refreshPublishedFlux() {
  if (!["http:", "https:"].includes(location.protocol)) return;
  try {
    const response = await fetch(`./flux-report.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const report = await response.json();
    if (report.checkedAt && report.checkedAt !== window.currentFlux?.checkedAt) renderFlux(report);
  } catch { /* Garder le dernier rapport disponible si le réseau échoue. */ }
}
if (["http:", "https:"].includes(location.protocol)) {
  refreshPublishedFlux();
  setInterval(refreshPublishedFlux, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshPublishedFlux();
  });
}
if (location.protocol === "http:" || location.protocol === "https:") {
  fetch("/api/flux").then((response) => response.ok ? response.json() : null)
    .then((report) => { if (report) renderFlux(report); }).catch(() => {});
}
