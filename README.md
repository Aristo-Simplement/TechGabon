# TECHGABON

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

## Vérification par e-mail (activer les envois réels)

À l'inscription, un profil professionnel ou une fiche entreprise est créé avec le statut
"non vérifié", et un e-mail de confirmation est envoyé automatiquement.

**Sans configuration**, l'e-mail n'est pas réellement envoyé : le lien de confirmation
s'affiche dans les logs du serveur (utile en développement). Pour activer l'envoi réel :

1. Crée un compte gratuit sur [resend.com](https://resend.com).
2. Vérifie un domaine d'envoi (ou utilise leur domaine de test `onboarding@resend.dev`
   pour commencer).
3. Génère une clé API sur Resend.
4. Ajoute-la comme variable d'environnement :
   - **En local** : crée un fichier `.env.local` à la racine du projet avec
     `RESEND_API_KEY=re_ta_cle_ici`
   - **Sur Vercel** : Project Settings → Environment Variables → ajoute `RESEND_API_KEY`,
     puis redéploie.
5. Ouvre `app/api/send-verification/route.js` et remplace `FROM_EMAIL` par une adresse
   de ton domaine vérifié une fois prêt.

**Limite importante à connaître** : ce prototype stocke les comptes dans le
`localStorage` du navigateur, pas dans une vraie base de données. Le lien de
confirmation ne fonctionne donc que si on l'ouvre **depuis le même appareil et le même
navigateur** que ceux utilisés à l'inscription. Pour une vérification fiable depuis
n'importe quel appareil (cas normal en production), il faut migrer `professionals` et
`companies` vers une vraie base de données (Supabase, Neon, etc.) — l'API et la page
`/verify` sont déjà structurées pour accueillir ce changement facilement.

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
