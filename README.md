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
- Blog public alimenté par Supabase, avec articles publiés, image de couverture,
  résumé et page détail.
- Interface d'administration du blog sur `/admin/blog`, protégée par session.
- Upload d'images d'articles vers Supabase Storage.
- Formulaire de contact avec envoi d'e-mail via Nodemailer.
- Pages légales, navigation responsive, liens d'accessibilité, SEO, Open Graph,
  Vercel Analytics et Speed Insights.

## Stack technique

- [Next.js](https://nextjs.org/) avec App Router
- [React](https://react.dev/) et TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) pour les articles du blog et les images
- [Nodemailer](https://nodemailer.com/) pour le formulaire de contact
- [Vercel Analytics](https://vercel.com/analytics) et Speed Insights

## Lancer le projet en local

Prérequis : Node.js et npm.

```bash
npm install
cp .env.example .env.local
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

NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-public
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role-cote-serveur
SUPABASE_BLOG_TABLE=articles
SUPABASE_BLOG_IMAGES_BUCKET=blog-images
```

Pour activer le formulaire de contact, ajoutez aussi dans `.env.local` les
identifiants de la boîte mail utilisée par Nodemailer :

```env
EMAIL_USER=votre-adresse@gmail.com
EMAIL_PASS=votre-mot-de-passe-ou-mot-de-passe-application
```

## Configuration Supabase

Le dossier `supabase/` contient le script SQL de création de la table des
articles.

1. Ouvrir l'éditeur SQL du projet Supabase.
2. Exécuter `supabase/blog.sql`.
3. Renseigner les variables Supabase dans `.env.local`.
4. Créer le bucket Storage utilisé pour les images du blog, par défaut
   `blog-images`.
5. Changer les identifiants d'administration avant toute mise en production.

Le blog public est disponible sur `/blog`, et l'administration sur
`/admin/blog`.

## Scripts disponibles

```bash
npm run dev      # démarre le serveur de développement
npm run build    # crée la version de production
npm run start    # lance la version de production
npm run lint     # lance ESLint
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
supabase/            Script SQL et notes de configuration du blog
```

## Déploiement

Le projet est prêt pour un déploiement sur Vercel. Pensez à configurer les
variables d'environnement dans le tableau de bord Vercel avant la mise en ligne,
notamment les clés Supabase, les identifiants admin et les identifiants e-mail.
