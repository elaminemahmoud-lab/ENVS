# Sahra — voyages et veille en Algérie

Lire [PROJET.md](PROJET.md) pour connaître l’objectif, les sources et les limites réelles du projet.

## Utilisation locale

Avec Node.js 24 et Git installés :

```powershell
node serveur.mjs
```

Ouvrir http://127.0.0.1:3000. Le bouton « Contrôler maintenant » utilise uniquement le serveur local.

## Publier sur GitHub

1. Se connecter à GitHub et créer un dépôt vide nommé `sahra`, sans ajouter de README ni de licence. Un dépôt public permet d’utiliser GitHub Pages avec GitHub Free ; pour un dépôt privé, vérifier l’éligibilité du forfait. Le code d’un dépôt public sera visible par tous. Aucun compte n’est nécessaire pour consulter le site public.
2. Depuis PowerShell dans ce dossier, initialiser et envoyer le projet. Remplacer `TON-COMPTE` par le compte GitHub réel. Si Git demande une identité, renseigner le nom et l’adresse de commit de son choix, éventuellement l’adresse privée fournie par GitHub. Ne jamais placer de jeton dans ces commandes.

```powershell
git init -b main
git add .
git commit -m "Préparer Sahra et sa veille automatique"
git remote add origin https://github.com/TON-COMPTE/sahra.git
git push -u origin main
```

3. Dans le dépôt GitHub, ouvrir **Settings → Pages → Build and deployment → Source** et choisir **GitHub Actions**.
4. Ouvrir **Actions → Veille Sahra → Run workflow**, choisir `main` et lancer. Si l’exécution déclenchée par le premier envoi a échoué avant la configuration Pages, la relancer après cette configuration.
5. Attendre le succès de l’étape « Publier le site actualisé ». Son lien donne l’adresse du site, généralement `https://TON-COMPTE.github.io/sahra/`.

Le workflow utilise le jeton temporaire fourni par GitHub Actions, sans clé API personnelle. Les permissions d’écriture du contenu, de publication Pages et d’identité sont déclarées dans son fichier. Une politique d’organisation ou une protection de branche peut bloquer l’enregistrement des rapports : consulter les journaux en cas d’échec.

## Fonctionnement automatique

- Un contrôle est prévu chaque heure à la minute 23. GitHub peut retarder ou omettre une exécution ; la date affichée sur le site fait foi.
- Les pages et flux publics sont contrôlés, puis les rapports sont enregistrés et le site est republié dans la même exécution.
- Une page de Sahra ouverte récupère les rapports publiés toutes les cinq minutes et lorsqu’elle revient au premier plan. Ce mécanisme ne déclenche pas de collecte supplémentaire.
- Les dates sont affichées à l’heure d’Alger. Le suivi ne modifie pas automatiquement les prix et disponibilités des circuits.
- Dans un dépôt public sans activité pendant 60 jours, GitHub peut désactiver les workflows planifiés. Vérifier leur état dans Actions.
- Cette publication est distincte de la veille générale du chat Codex.

## Vérifications locales

```powershell
node --test veille-monitor.test.mjs flux-filters.test.mjs site.test.mjs taux-monitor.test.mjs
node publier-static.mjs
```

`dist/` contient les fichiers du site à publier. Il est ignoré par Git et reconstruit par le workflow.

## Conversion EUR/DZD

`node taux-monitor.mjs` récupère le tableau quotidien de la Banque d’Algérie. Le workflow l’exécute à chaque collecte ; le bouton de contrôle local aussi. La cotation et sa date sont conservées dans `taux-report.json` et `taux-data.js`. En cas d’échec, la dernière valeur reste utilisable et le site le signale. Les prix en euros des agences restent la référence : la conversion n’inclut ni frais ni suppléments. Recharger la page après une collecte pour utiliser le nouveau taux ; une page déjà ouverte conserve une conversion cohérente avec son taux affiché.
