# Projet ENVS — Sahra

## Objectif

Sahra est un site de découverte et de planification de voyages en Algérie. Le visiteur indique une destination, un type de voyage, un budget en dinars, un nombre de personnes et une durée. Le site affiche des circuits et permet de contacter des agences.

## Outil de veille

Le projet utilise maintenant `veille-monitor.mjs`, un outil de suivi de pages officielles sans dépendance externe. Les pages à surveiller sont dans `veille-sources.json` : sites d'agences et pages de circuits. À chaque contrôle, l'outil télécharge le texte de chaque page, calcule son empreinte SHA-256 et la compare au dernier contrôle conservé dans `veille-state.json`. Un premier contrôle établit la référence ; les suivants signalent les pages modifiées, inchangées ou inaccessibles. Le rapport est publié dans `veille-data.js` et affiché par `veille.js` dans la section « Veille » du site.

La même liste comprend trois pages de **concurrents** : TourRadar, Nomade Aventure et Terres d'Aventure. Leurs résultats sont affichés séparément dans la section « Veille concurrentielle ».

`flux-monitor.mjs` ajoute une **veille médias** à partir d'une recherche RSS Google Actualités « tourisme Algérie » et une **veille réseaux sociaux** à partir des publications publiques Mastodon associées aux mots-dièses Algérie et Djanet. Le rapport `flux-report.json` est affiché par `flux.js`. Les publications sociales de plus de 90 jours sont ignorées. Ces sources publiques sont gratuites et ne demandent ni compte ni clé API.

## Les quatre veilles du devoir

Le tableau de bord « Veille stratégique » met en regard les quatre domaines demandés par le devoir et leurs trois étapes : collecte, analyse, diffusion. Il montre le nombre de pages suivies, les pages modifiées et les sources ou flux indisponibles. Le bloc **À examiner après le contrôle** donne des liens directs vers les pages modifiées ou inaccessibles et précise que ces changements doivent être vérifiés. Les cartes distinguent désormais une modification, un premier relevé, une erreur et une page inchangée. Le bouton **Exporter les observations (.csv)** produit un fichier ouvrable dans un tableur avec le domaine correct pour chaque source, la date du contrôle et, pour les articles, la date du signal.

| Domaine | Collecte réellement active | Analyse réellement active | Diffusion réellement active |
| --- | --- | --- | --- |
| Technologique | Page publique de l'APS sur l'innovation touristique et recherche d'actualités ciblée | Comptage et classement des signaux, export CSV | Tableau de bord Sahra |
| Concurrentielle | Comparaison des pages TourRadar, Nomade Aventure et Terres d'Aventure | Détection des modifications par empreinte SHA-256, export CSV | Tableau de bord Sahra |
| Commerciale | Pages des agences, recherche d'actualités sur les vols et les prix, publications publiques Mastodon pertinentes | État des pages et export CSV | Tableau de bord Sahra |
| Sociétale | Pages officielles France Diplomatie sur l'entrée et la sécurité, recherche d'actualités ciblée | État des pages et export CSV | Tableau de bord Sahra |

La matrice du site décrit seulement les outils actifs : les moniteurs Node.js, le flux RSS Google Actualités, l'API publique Mastodon, la comparaison SHA-256, le tableau de bord Sahra et l'export CSV. **Inoreader, Google Alertes, Google Flights, Google Sheets, Google Trends, Notion, Slack et Brevo** restent des possibilités étudiées, **pas des connexions actives**. L'export CSV peut être importé dans un tableur, mais le site n'envoie aucune donnée à ces services. Les alertes par e-mail et les messages d'équipe demanderaient une configuration ultérieure.

Pour lancer le site avec accès réseau et contrôle à la demande :

```powershell
node serveur.mjs
```

Ouvrir ensuite `http://127.0.0.1:3000` et utiliser le bouton **Contrôler maintenant**. Le serveur écoute uniquement sur l'ordinateur local et lance le moniteur côté Node ; le navigateur ne tente pas de récupérer directement les sites tiers, qui peuvent refuser les requêtes entre domaines. Le serveur doit rester lancé pendant l'utilisation du bouton.

Pour effectuer un contrôle manuel sans serveur :

```powershell
node veille-monitor.mjs
node flux-monitor.mjs
```

Ouvrir ensuite `Sahra.html` dans le navigateur. La page peut être ouverte directement depuis le disque, car le rapport est un fichier JavaScript local ; le bouton de contrôle réseau n'apparaît que lorsque le serveur local est disponible.

Le workflow `.github/workflows/veille.yml` est préparé pour un contrôle **chaque heure, à la minute 23**, ainsi qu’à chaque envoi sur la branche `main` et sur lancement manuel. Il contrôle les sources, enregistre l’état et les rapports dans le dépôt, puis publie le site sur **GitHub Pages**. `publier-static.mjs` prépare dans `dist/` uniquement les fichiers publics et copie `Sahra.html` en `index.html`. Les rapports JSON sont inclus pour qu’une page ouverte puisse récupérer les nouvelles données toutes les cinq minutes et à son retour au premier plan. Les dates affichées utilisent l’heure d’Alger. Le serveur local fournit aussi ces rapports.

Cette configuration n’est **pas encore active sur GitHub** tant que le dossier n’a pas été envoyé sur un dépôt, que GitHub Pages n’a pas été configuré avec la source **GitHub Actions** et qu’une exécution n’a pas réussi. Voir `README.md` pour la procédure. Les contrôles planifiés de GitHub peuvent être retardés ou omis ; consulter la date du dernier contrôle affichée sur le site. Il ne s’agit pas d’un suivi instantané. Une collecte en échec est signalée dans les journaux ; le workflow essaie néanmoins de publier les rapports disponibles.

La veille générale programmée dans le chat Codex est indépendante : elle ne lance pas ces scripts et ne publie pas Sahra.

Pour ajouter une source, ajouter un objet `name`, `url` (HTTPS) et `kind` dans `veille-sources.json`. Utiliser de préférence la page précise d'un circuit, afin de limiter les changements sans rapport. Aucun identifiant ni clé API n'est nécessaire.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `Sahra.html` | Structure et contenu du site. |
| `style.css` | Mise en page et adaptation mobile. |
| `app.js` | Circuits, filtres et calculs en DZD. |
| `veille-sources.json` | Liste des pages suivies, y compris les concurrents. |
| `veille-monitor.mjs` | Comparaison et production du rapport de veille. |
| `serveur.mjs` | Site local avec accès réseau et contrôle à la demande. |
| `veille-state.json` | Empreintes des pages après le premier contrôle. |
| `veille-report.json` | Rapport au format JSON pour le serveur. |
| `veille-data.js` | Rapport lu par le site. |
| `veille.js` | Affichage du rapport. |
| `flux-monitor.mjs` | Collecte des actualités et publications publiques. |
| `flux-report.json` et `flux-data.js` | Rapport des flux pour le serveur et le site. |
| `flux.js` | Affichage des actualités et publications. |
| `strategie.js` | Tableau de bord des quatre veilles et export CSV. |
| `.github/workflows/veille.yml` | Contrôle horaire et publication sur GitHub Pages après activation. |
| `publier-static.mjs` | Préparation des fichiers publics pour GitHub Pages. |
| `README.md` | Installation locale et activation de la publication GitHub. |

## Données et limites

- Les articles des rubriques et de la veille médias sont filtrés par `flux-filters.mjs` : éditeur appartenant à une liste explicite de domaines, titre lié au voyage et à l’Algérie, date valide dans les 90 derniers jours, puis dédoublonnage et tri par date. Le domaine de l’éditeur est lu dans le flux RSS, pas déduit de son nom affiché. Cette sélection peut écarter des articles pertinents et ne constitue pas une validation de leur contenu. Une collecte réussie sans article pertinent affiche zéro résultat. En cas d’échec, les anciens articles ne sont conservés que s’ils passent encore les filtres.
- Les échecs des pages suivies incluent désormais une raison dans le rapport (statut HTTP, délai dépassé, contenu trop court ou connexion impossible). Le site distingue notamment un refus ou une limitation HTTP 403/429. Les liens restent consultables directement ; les sources ne sont pas supprimées pour masquer les erreurs.

- Les circuits affichés dans `app.js` restent une sélection ajoutée manuellement à partir de Ziguade Travel, Algérie Tours et Evaneos. **La veille ne modifie jamais automatiquement les prix ni les disponibilités.** Un changement de page invite à revérifier la source officielle.
- Certains sites peuvent bloquer les requêtes automatiques ou rendre leurs offres uniquement avec JavaScript. Dans ce cas, le résultat est « Contrôle impossible » ou le changement n'est pas détecté. L'ancien état est conservé en cas d'échec.
- Au premier contrôle du 15 novembre 2026, Evaneos et Pegamel Travel ont répondu HTTP 403 à l'outil ; leurs pages restent suivies mais le rapport affiche leur échec. Les trois sources concurrentielles suivies sont [TourRadar](https://www.tourradar.com/d/algeria), [Nomade Aventure](https://www.nomade-aventure.com/voyage-algerie) et [Terres d'Aventure](https://www.terdav.com/ps-algerie/tp-circuit-accompagne).
- La comparaison porte sur le texte de la page entière. Une modification sans rapport avec les voyages peut donc déclencher un signal. Les changements ne constituent pas des offres validées.
- Les résultats médias sont des liens de recherche, pas des articles vérifiés par Sahra. Le format du flux RSS Google Actualités peut évoluer. L'API Mastodon peut retourner peu de publications pertinentes ou être indisponible ; elle ne couvre pas Facebook, Instagram ou TikTok, dont l'accès automatisé public est limité.
- Les pages France Diplomatie concernent les voyageurs français. Les formalités applicables dépendent de la nationalité du voyageur ; le site renvoie à la source officielle et ne donne pas de conseil personnalisé.
- Les prix en euros sont convertis avec un taux indicatif fixe de `1 € = 151,688 DZD`, relevé pour le 12 novembre 2026. Les tarifs et le taux doivent être vérifiés avant une utilisation réelle.
- Les photos proviennent de Wikimedia Commons, avec un lien vers leurs crédits.

## Sources techniques

- [changedetection.io](https://changedetection.io/) a été évalué comme solution hébergée ou auto-hébergée de surveillance de pages. Le projet garde un outil local léger pour fonctionner sans compte ni serveur supplémentaire.
- [GitHub Actions, déclenchement planifié](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) pour le contrôle automatique après publication.
- [Node.js, API Fetch](https://nodejs.org/api/globals.html) pour la récupération des pages.
- [Mastodon, accès aux données publiques](https://docs.joinmastodon.org/client/public/) pour les publications sociales.
- [Google Actualités](https://news.google.com/) pour la recherche d'articles.
- [APS, innovation touristique](https://www.aps.dz/fr/algerie/education-et-technologie/mvawk748-concours-national-de-la-meilleure-innovation-touristique-intelligente-11-projets-primes) et [France Diplomatie, entrée et séjour](https://www.diplomatie.gouv.fr/fr/information-par-pays/algerie/conseils-aux-voyageurs-entree-sejour) pour les sources institutionnelles.
- [Inoreader, offre gratuite](https://www.inoreader.com/pricing/feature/rss_common), [Google Alertes](https://support.google.com/websearch/answer/4815696), [Google Sheets](https://workspace.google.com/essentials/), [Notion](https://www.notion.com/pricing), [Slack](https://slack.com/pricing/free) et [Brevo](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans) pour les outils complémentaires non connectés.

