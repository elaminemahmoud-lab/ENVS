/* Affiche les rapports de veille et permet un contrôle depuis le serveur local. */
const veilleStatus = document.querySelector("#veilleStatus");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
};

function renderVeille(report) {
  window.currentVeille = report;
  const sources = report?.sources || [];
  if (!report?.checkedAt) {
    veilleStatus.textContent = "Veille prête, en attente du premier contrôle des sources.";
  } else {
    const when = new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt));
    const changed = sources.filter((source) => source.status === "changed").length;
    const failed = sources.filter((source) => source.status === "error").length;
    veilleStatus.textContent = `Dernier contrôle : ${when} · ${sources.length} sources · ${changed} changement(s) · ${failed} erreur(s).`;
  }
  const cards = (items) => items.length
    ? items.map((source) => {
        const label = { changed: "Page modifiée", unchanged: "Aucun changement", new: "Premier relevé", error: "Contrôle impossible" }[source.status] || "À vérifier";
        const failureLabel = ["HTTP 403", "HTTP 429"].includes(source.error)
          ? "Le site refuse ou limite les contrôles automatiques. Consultez le lien directement."
          : source.error ? `${source.error}. Consultez la source ou réessayez au prochain contrôle.`
          : "Réessayez au prochain contrôle.";
        return `<article class="card"><div class="body"><div class="loc">${escapeHtml(source.kind)}</div><h3>${escapeHtml(source.name)}</h3><p class="desc">${escapeHtml(label)}${source.status === "error" ? ` · ${escapeHtml(failureLabel)}` : ""}</p><div class="bottom"><a class="detail" href="${escapeHtml(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer">Voir la source ↗</a></div></div></article>`;
      }).join("")
    : '<div class="empty"><h3>Aucun contrôle effectué</h3><p>Les sources apparaîtront ici après la première exécution de l’outil de veille.</p></div>';
  document.querySelector("#veilleResults").innerHTML = cards(sources.filter((source) => source.group === "agences"));
  document.querySelector("#concurrenceResults").innerHTML = cards(sources.filter((source) => source.group === "concurrence"));
  document.querySelector("#referenceResults").innerHTML = cards(sources.filter((source) => ["technologie", "societale"].includes(source.group)));
  const recentChanges = (report?.changes || []).slice(0, 5);
  document.querySelector("#veilleChanges").innerHTML = recentChanges.length
    ? `<h3>Changements récents</h3><ul>${recentChanges.map((change) => `<li><a href="${escapeHtml(safeUrl(change.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(change.name)}</a> · ${escapeHtml(new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium" }).format(new Date(change.at)))}</li>`).join("")}</ul>`
    : "";
  window.renderStrategie?.(report, window.currentFlux || window.sahraFlux);
}

renderVeille(window.sahraVeille);
async function refreshPublishedVeille() {
  if (!["http:", "https:"].includes(location.protocol)) return;
  try {
    const response = await fetch(`./veille-report.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const report = await response.json();
    if (report.checkedAt && report.checkedAt !== window.currentVeille?.checkedAt) renderVeille(report);
  } catch { /* Garder le dernier rapport disponible si le réseau échoue. */ }
}
if (["http:", "https:"].includes(location.protocol)) {
  refreshPublishedVeille();
  setInterval(refreshPublishedVeille, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshPublishedVeille();
  });
}
if (location.protocol === "http:" || location.protocol === "https:") {
  const button = document.querySelector("#veilleRefresh");
  fetch("/api/veille").then((response) => response.ok ? response.json() : null)
    .then((report) => { if (report) { button.hidden = false; renderVeille(report); } }).catch(() => {});
  button.addEventListener("click", async () => {
    button.disabled = true;
    veilleStatus.textContent = "Contrôle des sources en cours…";
    try {
      const response = await fetch("/api/veille", { method: "POST" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const report = await response.json();
      renderVeille(report);
      const fluxResponse = await fetch("/api/flux");
      if (fluxResponse.ok) renderFlux(await fluxResponse.json());
    } catch {
      veilleStatus.textContent = "Le contrôle réseau a échoué. Vérifiez que le serveur local est démarré.";
    } finally { button.disabled = false; }
  });
}
