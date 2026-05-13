# Blog Supabase

1. Dans Supabase, ouvrez l'editeur SQL et executez `supabase/blog.sql`.
2. Dans `.env.local`, renseignez `SUPABASE_SERVICE_ROLE_KEY` avec la cle `service_role` du projet.
3. Gardez `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour la lecture publique des articles publies.
4. Changez `ADMIN_USERNAME`, `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` avant la mise en production.
5. Les images uploadees depuis l'admin sont envoyees dans le bucket Storage `blog-images`.

Le site lit les articles publies sur `/blog`.
L'administration est disponible sur `/admin/blog`.
