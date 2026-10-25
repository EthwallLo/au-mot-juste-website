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

Les lectures publiques excluent les brouillons. Leur cache expire après
60 secondes et est invalidé lors d’une création, modification ou suppression
depuis l’administration, avec l’accueil, les pages du blog et le sitemap.
