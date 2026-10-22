# ONASKILL

Prototype de plateforme mettant en relation entreprises, particuliers et professionnels
techniques vérifiés au Gabon. Construit avec Next.js, Tailwind CSS v4 et shadcn/ui.

Ce projet a été **compilé et testé avec succès** (`npm run build`) avant d'être livré —
il est prêt à être déployé tel quel.

## Déployer le site en ligne (obtenir un vrai lien) — ~10 minutes

### 1. Créer un compte GitHub (si tu n'en as pas déjà un)

Va sur [github.com](https://github.com) → "Sign up" → suis les étapes (email, mot de
passe, nom d'utilisateur). C'est gratuit.

### 2. Créer un nouveau dépôt (repository)

- Sur GitHub, clique sur le bouton **"+"** en haut à droite → **"New repository"**.
- Nom du dépôt : `techgabon` (ou ce que tu veux).
- Laisse-le **Public** ou **Private**, les deux fonctionnent.
- Ne coche **aucune** case (pas de README, pas de .gitignore — on les a déjà).
- Clique **"Create repository"**.

### 3. Envoyer ce projet vers GitHub

Dézippe le fichier que je t'ai donné, ouvre un terminal **dans le dossier du projet**
(le dossier qui contient `package.json`), puis colle ces commandes une par une
(remplace `TON-NOM-UTILISATEUR` par ton nom d'utilisateur GitHub) :

```bash
git init
git add .
git commit -m "Premier envoi de TECHGABON"
git branch -M main
git remote add origin https://github.com/TON-NOM-UTILISATEUR/techgabon.git
git push -u origin main
```

GitHub va probablement te demander de te connecter (un lien s'ouvrira dans ton
navigateur, ou GitHub te proposera de créer un "token" — suis simplement les
instructions affichées).

### 4. Déployer sur Vercel (le créateur de Next.js — gratuit, aucune carte bancaire requise)

- Va sur [vercel.com](https://vercel.com) → **"Sign Up"** → choisis **"Continue with
  GitHub"** (le plus rapide, ça connecte directement ton compte GitHub).
- Une fois connecté, clique **"Add New..."** → **"Project"**.
- Trouve ton dépôt `techgabon` dans la liste → clique **"Import"**.
- Vercel détecte automatiquement que c'est un projet Next.js — ne change rien.
- Clique **"Deploy"**.
- Attends 1 à 2 minutes.

Tu obtiens alors une vraie adresse du type `https://techgabon-xxxx.vercel.app` —
c'est ton lien à partager. Chaque fois que tu enverras une modification vers GitHub
(`git push`), Vercel republiera automatiquement le site.

## Envoi des e-mails (confirmation d'inscription, mot de passe oublié)

Le site envoie deux sortes d'e-mails : le lien de confirmation à l'inscription, et le lien
« Mot de passe oublié » (qui sert aussi à activer un compte pour un profil créé avant
l'arrivée des comptes). **Sans configuration**, rien n'est envoyé : le lien s'affiche dans
les logs du serveur.

Les identifiants se mettent **uniquement** dans Vercel → Project Settings → Environment
Variables (jamais dans le code), puis il faut redéployer. Choisir **une** des deux options :

### Option A — Gmail (gratuit, sans nom de domaine, ~500 e-mails/jour)
1. Utiliser une adresse Gmail dédiée au site (par ex. `onaskill.contact@gmail.com`).
2. Sur ce compte Google : activer la **validation en deux étapes**, puis créer un
   **mot de passe d'application** (Compte Google → Sécurité → Mots de passe des applications).
3. Dans Vercel, ajouter :
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = l'adresse Gmail
   - `SMTP_PASS` = le mot de passe d'application (16 lettres)
   - `FROM_EMAIL` = `ONASKILL <l'adresse Gmail>`

### Option B — Resend (nécessite un nom de domaine, ex. onaskill.com)
1. Créer un compte sur resend.com et y **vérifier le domaine** (ajout d'enregistrements DNS).
2. Dans Vercel, ajouter `RESEND_API_KEY` = la clé Resend, et
   `FROM_EMAIL` = `ONASKILL <contact@ton-domaine>`.

Sans domaine vérifié, Resend n'envoie qu'à l'adresse du propriétaire du compte Resend.

### Optionnel — `SESSION_SECRET`
Les sessions de connexion sont signées avec une clé dérivée de la base de données. Pour
utiliser une clé dédiée, ajouter `SESSION_SECRET` (une longue chaîne aléatoire) dans
Vercel. Attention : la changer déconnecte tout le monde.

## Stockage privé des documents (CV, diplômes)

Dans Vercel : projet → **Storage** → **Create** → **Blob** → le connecter au projet.
Vercel ajoute alors automatiquement la variable `BLOB_READ_WRITE_TOKEN` ; redéployer.
Les documents sont ensuite rangés dans un stockage **privé** (aucune adresse publique) et
seul leur propriétaire peut les ouvrir, via `/api/files/...`. Sans ce stockage, les
documents restent dans la base de données (fonctionne, mais limité en taille).

## Espace d'administration (modération)

1. Dans Vercel, ajouter `ADMIN_EMAILS` = ton adresse e-mail (plusieurs adresses possibles,
   séparées par des virgules), puis redéployer.
2. Sur le site, créer un compte **avec cette adresse** (par ex. un compte particulier) et
   **confirmer l'adresse** grâce au lien reçu par e-mail (l'envoi d'e-mails doit donc être
   configuré). Sans confirmation, l'accès administrateur reste fermé.
3. Le bouton « Administration » apparaît alors dans l'en-tête : on peut y masquer, rendre
   visible ou supprimer un profil, une fiche entreprise, un compte particulier ou une demande.

## Statistiques de visite

Dans Vercel : projet → **Analytics** → **Enable**. Statistiques anonymes, sans cookie.

## Nom de domaine

1. Acheter le domaine (par ex. onaskill.com) chez un registraire.
2. Vercel → projet → **Settings → Domains** → ajouter le domaine et suivre les
   instructions DNS affichées.
3. Ajouter la variable `NEXT_PUBLIC_SITE_URL` = `https://ton-domaine` (sans `/` final),
   puis redéployer : liens de partage, sitemap et e-mails utiliseront ce domaine.

## Développement local

Sans `POSTGRES_URL`, le site utilise une base locale enregistrée dans `.data/dev-db.json`
(ignorée par git) qui survit aux redémarrages. Supprimer ce dossier repart de zéro. Pour
travailler sur la vraie base, copier les variables de la base Vercel (Storage → ta base →
`.env.local`) dans un fichier `.env.local` à la racine.

## Connecter la base de données (étape désormais nécessaire)

Depuis cette version, TECHGABON utilise une vraie base de données partagée au lieu de
stocker les données dans chaque navigateur séparément. **Sans cette étape, le site
affichera une erreur de chargement** — c'est une étape obligatoire, pas optionnelle.

### 1. Créer la base de données (2 minutes, gratuit)

- Sur [vercel.com](https://vercel.com), ouvre ton projet `techgabon`.
- Va dans l'onglet **Storage** en haut.
- Clique **Create Database** → choisis **Postgres** (propulsé par Neon).
- Donne-lui un nom (ex : `techgabon-db`) → **Create**.
- Sur l'écran suivant, clique **Connect** puis **Connect Project** pour le relier à ton
  projet `techgabon` — Vercel configure automatiquement toutes les variables
  d'environnement nécessaires (`POSTGRES_URL` etc.), tu n'as rien à copier toi-même.

### 2. Redéployer

Un simple `git push` suffit pour que le nouveau déploiement utilise la base de données
fraîchement connectée :

```bash
git add .
git commit -m "Connexion base de donnees"
git push
```

Les tables (`professionals`, `companies`, `missions`) se créent automatiquement au tout
premier chargement du site — aucune commande SQL à taper à la main. Le site se
pré-remplit aussi avec quelques exemples de profils au premier lancement, comme avant.

### Ce que ça change concrètement

- Un professionnel qui crée son profil est désormais visible par **tout le monde**,
  sur n'importe quel appareil — plus seulement dans son propre navigateur.
- Toutes les entreprises voient la **même** liste de professionnels et de missions.

### Ce qui n'est toujours pas résolu par cette étape

Il n'y a **pas encore de vraie authentification** (pas de mot de passe). "Mon profil" /
"mon entreprise" reste repéré par un identifiant stocké dans le navigateur, comme avant
— n'importe qui pourrait théoriquement modifier n'importe quel profil en connaissant son
identifiant technique. Ajouter un vrai système de connexion est la suite logique.

## Travailler sur le projet en local (optionnel)

Si tu veux voir le site sur ton ordinateur avant de le déployer :

```bash
npm install
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Notes techniques

- Les données (professionnels, entreprises, missions) sont sauvegardées dans le
  `localStorage` du navigateur — propres à chaque appareil/navigateur, pas encore
  partagées entre utilisateurs. Une vraie base de données (Supabase, Postgres...)
  serait la prochaine étape pour une version multi-utilisateurs.
- Les composants d'interface (`components/ui/`) suivent l'implémentation standard
  de [shadcn/ui](https://ui.shadcn.com).
- Les photos utilisées viennent de [Pexels](https://pexels.com) (libres de droits).
