# Publication de la newsletter

La version locale conserve ses abonnements et ses messages dans `.local/newsletter`.
Elle n’envoie pas de messages automatiquement. La production utilise quatre tables
Neon distinctes, créées automatiquement au premier accès. Aucun abonnement de test
n’est copié depuis cet ordinateur.

## Déploiement Vercel

1. Exécuter `node scripts/prepare-newsletter-production.mjs`.
2. Dans Vercel → projet → Settings → Environment Variables, importer le fichier
   privé `.env.newsletter.production`, uniquement pour **Production**. Garder les
   clés existantes lors des déploiements suivants : les changer invaliderait les
   liens des mails déjà reçus. Le fichier n’est jamais publié ni suivi par Git.
3. Vérifier que `DATABASE_URL`, `EMAIL_USER` et `EMAIL_PASS` sont déjà renseignés
   pour **Production**. Les deux variables `EMAIL_*` sont les identifiants Gmail
   déjà utilisés par le formulaire de contact et validés lors du test réel.
4. Faire le push puis attendre la réussite du déploiement Vercel.
5. Ouvrir `/admin/newsletter`. Cliquer une première fois sur « Relancer les envois
   en attente » pour armer les articles déjà planifiés avant ce déploiement.
6. Faire une nouvelle inscription sur le site public, confirmer depuis le mail,
   puis vérifier une nouvelle publication et une publication planifiée.

`NEWSLETTER_SITE_URL` doit correspondre au domaine public HTTPS utilisé par les
visiteurs. Les liens des mails sont construits depuis ce réglage, jamais depuis
un en-tête fourni par un visiteur. Les déploiements Preview ne peuvent pas envoyer
de newsletters, même s’ils héritent des variables de production.

## Envois et planification

Chaque sauvegarde d’un article publié ou planifié enregistre sa tâche dans Neon,
puis démarre un Vercel Workflow. Le workflow attend l’échéance prévue, relit
l’article pour respecter un report ou une dépublication, puis envoie son contenu
aux abonnés qui avaient déjà confirmé à sa publication. Aucun ancien article n’est
envoyé lors de l’activation. Les brouillons et les dates futures restent privés.

Les articles sont envoyés individuellement. Une contrainte unique empêche de
créer deux envois du même article au même abonné, et une réservation SQL évite
que deux exécutions concurrentes envoient le même message. Les erreurs SMTP
conservent le message pour une nouvelle tentative. Comme pour tout envoi SMTP,
une interruption entre l’acceptation par Gmail et son enregistrement en base peut
nécessiter une vérification manuelle : un message bloqué « En cours » est visible
dans l’administration, passe à « À vérifier » après dix minutes, et n’est pas
renvoyé automatiquement.

Une tâche de récupération quotidienne est déclarée dans `vercel.json`, compatible
avec Vercel Hobby. Elle relance les workflows en échec et les confirmations en
attente. La précision de publication repose sur le workflow, pas sur ce cron.
La page `/admin/newsletter` permet aussi de relancer les tâches en attente.

Les nouveaux abonnements nécessitent un consentement explicite et un lien signé
valable 24 heures. Chaque adresse reçoit au plus une confirmation par période de
24 heures ; les requêtes d’inscription sont limitées à cinq par heure et par
adresse IP (seule une empreinte temporaire est conservée). La désinscription
annule les envois en attente. Une réinscription invalide les anciens liens.

Gmail reste l’expéditeur de cette première version. Sa capacité dépend des quotas
du compte ; pour une liste importante, utiliser un prestataire d’e-mail adapté.

Les règles métier sont testées avec PostgreSQL embarqué et un transport SMTP
simulé. Les vérifications de déploiement réel se font après le push, sur le
domaine public, avec une adresse de test explicitement choisie.
