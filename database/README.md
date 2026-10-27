# Bases des articles

En développement, les articles sont enregistrés sur cet ordinateur avec PGlite
(PostgreSQL embarqué), dans `.local/database`. Les images ajoutées depuis
l’administration sont enregistrées dans `.local/images`. Ces dossiers ne sont
pas suivis par Git et ne sont pas inclus dans les fichiers de déploiement.

Sur Vercel, les articles utilisent Neon et les images Vercel Blob, avec les
identifiants définis dans le tableau de bord Vercel. Une URL Neon présente sur
l’ordinateur ne suffit pas à activer une connexion distante : le choix du
stockage dépend de l’environnement, et `vercel dev` reste en mode local.

## Configuration

1. Renseigner les identifiants d’administration dans `.env.local`.
2. Lancer `npm run dev`. La base locale est initialisée automatiquement au premier accès.
3. Ouvrir `/admin/blog` pour créer des articles de test ; la base locale part vide.

`npm run db:setup` permet aussi de préparer la base avant le démarrage du site.
Arrêter le serveur avant cette commande, car une seule instance de PGlite doit
ouvrir le même dossier. Les données persistent après l’arrêt et le redémarrage.

`LOCAL_DATABASE_PATH` et `LOCAL_IMAGES_PATH` permettent de personnaliser les
dossiers locaux. Les anciens identifiants distants peuvent être conservés dans
un fichier `.env.production.local` privé ; ils ne sont pas utilisés par le
stockage local. Sur Vercel, conserver `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN`
dans les variables de l’environnement concerné.

Le script `schema.sql` reste compatible avec l’éditeur SQL de Neon.
Les identifiants d’administration restent définis par `ADMIN_USERNAME`,
`ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET`.

Les images acceptées sont JPEG, PNG, WebP, GIF et AVIF, jusqu’à 5 Mo. L’adresse
renvoyée par Blob est enregistrée avec l’article lors de sa sauvegarde.

Les articles ont trois statuts : `draft`, `scheduled` et `published`. Un article
planifié doit avoir une date de publication. L’initialisation locale applique
le même schéma que Neon, sans effacer les articles.

Les lectures publiques excluent les brouillons et les dates de publication
futures. Les données mises en cache incluent les publications à venir, mais la
date est vérifiée hors du cache à chaque visite. L’accueil, le blog, les pages
d’articles et le sitemap sont rendus à la demande pour respecter cette échéance.
Un article planifié dont la date est atteinte est affiché comme publié dans
l’administration, sans tâche planifiée ni écriture automatique en base.

Le cache des données expire après 60 secondes et est invalidé lors d’une
création, modification ou suppression depuis l’administration.

## Formulaire de contact

Le formulaire utilise aussi cette base pour limiter les demandes à cinq par
heure et par adresse IP. La table `contact_rate_limits` est créée automatiquement
au premier envoi valide, indépendamment de la newsletter. Les adresses IP ne
sont pas enregistrées en clair : les compteurs utilisent une empreinte HMAC
avec `EMAIL_PASS`, déjà nécessaire à l’envoi des mails. Les compteurs expirés
sont supprimés lors des demandes suivantes.

La protection utilise PGlite en local et Neon sur Vercel. Si le compteur ou le
service de mail est indisponible, le formulaire affiche un message d’erreur et
n’annonce pas un envoi réussi. Aucune variable supplémentaire n’est nécessaire.
