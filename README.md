# Au mot juste

Site vitrine de **Au mot juste**, l'activité de correction, relecture,
réécriture et traduction anglais-français de Lorena Guedouani.

Le site sert à présenter les prestations proposées, expliquer l'intérêt d'une
correction professionnelle, mettre en avant le parcours de Lorena, publier des
articles autour de l'écriture et permettre aux visiteurs de demander un devis
ou de prendre contact.

## Fonctionnalités

- Page d'accueil de présentation du service et des publics accompagnés.
- Pages dédiées à la correction et à la traduction, avec types de documents et
  tarifs.
- Page "Qui suis-je ?" pour présenter le parcours, les formations, les
  expériences et les certifications.
- Blog public alimenté par Neon PostgreSQL, avec articles publiés, image de couverture,
  résumé et page détail.
- Interface d'administration du blog sur `/admin/blog`, protégée par session.
- Prévisualisation privée des articles avant enregistrement ou publication, avec
  la même mise en page que le blog public.
- Upload direct d’images d’articles vers Vercel Blob.
- Formulaire de contact avec envoi d'e-mail via Nodemailer.
- Pages légales, navigation responsive, liens d'accessibilité, SEO, Open Graph,
  Vercel Analytics et Speed Insights.

## Stack technique

- [Next.js](https://nextjs.org/) avec App Router
- [React](https://react.dev/) et TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Neon](https://neon.com/) pour les articles du blog (PostgreSQL)
- [Vercel Blob](https://vercel.com/docs/vercel-blob) pour les images des articles
- [Nodemailer](https://nodemailer.com/) pour le formulaire de contact
- [Vercel Analytics](https://vercel.com/analytics) et Speed Insights

## Lancer le projet en local

Prérequis : Node.js et npm.

```bash
npm install
cp .env.example .env.local
npm run db:setup
npm run dev
```

Le site est ensuite disponible sur `http://localhost:3000`.

## Variables d'environnement

Le fichier `.env.example` liste les variables nécessaires au blog et à
l'administration :

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-moi
ADMIN_SESSION_SECRET=une-longue-chaine-aleatoire

DATABASE_URL=postgresql://utilisateur:mot-de-passe@votre-base.neon.tech/neondb?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_a_remplacer
```

Pour activer le formulaire de contact, ajoutez aussi dans `.env.local` les
identifiants de la boîte mail utilisée par Nodemailer :

```env
EMAIL_USER=votre-adresse@gmail.com
EMAIL_PASS=votre-mot-de-passe-ou-mot-de-passe-application
```

## Configuration Neon et Vercel Blob

Le dossier `database/` contient le script SQL de création de la table des
articles.

1. Connecter la base Neon au projet Vercel et récupérer `DATABASE_URL`.
2. Créer un stockage Vercel Blob **public**, le connecter au même projet et
   récupérer `BLOB_READ_WRITE_TOKEN`.
3. Renseigner ces deux variables dans `.env.local` pour le développement.
4. Exécuter `npm run db:setup`, ou copier `database/schema.sql` dans l’éditeur
   SQL de Neon. La création du schéma n’efface pas les articles existants.
5. Changer les identifiants d'administration avant toute mise en production.

Le blog public est disponible sur `/blog`, et l'administration sur
`/admin/blog`.

## Scripts disponibles

```bash
npm run dev      # démarre le serveur de développement
npm run build    # crée la version de production
npm run start    # lance la version de production
npm run lint     # lance ESLint
npm run db:setup # crée la table des articles dans Neon
npm test         # vérifie les articles sur PostgreSQL de test et l’accès aux images
```

## Structure du projet

```text
app/
  admin/blog/        Interface d'administration des articles
  api/               Routes API contact, auth admin, articles et images
  blog/              Blog public et pages d'articles
  components/        Composants réutilisables du site
  correction/        Page prestation correction
  traduction/        Page prestation traduction
  qui-suis-je/       Page parcours et présentation
public/              Images, icônes, logo et police locale
database/            Schéma PostgreSQL et configuration du blog
scripts/             Initialisation de la base Neon
```

## Déploiement

Le projet est prêt pour un déploiement sur Vercel. Pensez à configurer les
variables d'environnement dans le tableau de bord Vercel avant la mise en ligne,
notamment `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, les identifiants admin et les
identifiants e-mail. Après l’ajout des variables, créer un nouveau déploiement
pour les prendre en compte. Les articles et les images restent stockés dans
Neon et Blob lors des déploiements suivants.

Les tests utilisent un moteur PostgreSQL en mémoire (PGlite) et des jetons Blob
fictifs : ils ne nécessitent pas les identifiants des services en ligne.

## Référencement

Les pages publiques définissent leurs propres titre, description, URL canonique
et métadonnées Open Graph. Le domaine de production est centralisé dans
`app/lib/seo.ts`.

Le fichier `/sitemap.xml` regroupe les pages publiques et les articles publiés du
blog, avec leur date de modification. Son cache expire après 60 secondes et
est également invalidé lors des modifications d’articles depuis
l’administration. `/robots.txt` indique son adresse aux moteurs de recherche.
L’administration conserve sa directive `noindex` et n’apparaît pas dans le sitemap.

Après déploiement, le sitemap peut être soumis dans Google Search Console à
l’adresse `https://aumotjuste-correction.fr/sitemap.xml`.
