# Blog Neon et Vercel Blob

Les articles sont stockés dans PostgreSQL sur Neon. Les images sont envoyées
directement depuis le navigateur vers un stockage Vercel Blob public, après
vérification de la session d’administration.

## Configuration

1. Connecter Neon et le stockage Blob public au projet Vercel.
2. Ajouter `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` dans `.env.local` pour le
   développement, ainsi que dans les environnements Vercel utilisés.
3. Exécuter `npm run db:setup` pour créer la table et son déclencheur de mise à
   jour. La commande peut être relancée sans effacer les articles.
4. Démarrer le site et ouvrir `/admin/blog` pour écrire un premier article.

Le script `schema.sql` peut aussi être exécuté dans l’éditeur SQL de Neon.
Les identifiants d’administration restent définis par `ADMIN_USERNAME`,
`ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET`.

Les images acceptées sont JPEG, PNG, WebP, GIF et AVIF, jusqu’à 5 Mo. L’adresse
renvoyée par Blob est enregistrée avec l’article lors de sa sauvegarde.

Les articles ont trois statuts : `draft`, `scheduled` et `published`. Un article
planifié doit avoir une date de publication. Relancer `npm run db:setup` ajoute
les contraintes nécessaires sur une base existante, sans effacer les articles.

Les lectures publiques excluent les brouillons et les dates de publication
futures. Les données mises en cache incluent les publications à venir, mais la
date est vérifiée hors du cache à chaque visite. L’accueil, le blog, les pages
d’articles et le sitemap sont rendus à la demande pour respecter cette échéance.
Un article planifié dont la date est atteinte est affiché comme publié dans
l’administration, sans tâche planifiée ni écriture automatique en base.

Le cache des données expire après 60 secondes et est invalidé lors d’une
création, modification ou suppression depuis l’administration.
