import type { BlogPost } from "@/app/lib/blog";

export const NEWSLETTER_EXAMPLE = {
  id: "local-newsletter-example",
  title: "Et si l’on prenait le temps de relire ?",
  excerpt: "Une petite pause peut faire toute la différence entre un texte écrit et un texte abouti.",
  content: "Bonjour,\n\nOn connaît tous ce moment : on vient de terminer un texte, on le relit rapidement, et tout semble aller. Puis, quelques heures plus tard, une coquille nous saute aux yeux.\n\n## Prendre un peu de distance\n\nLa première astuce est toute simple : **laisser reposer son texte**. Une pause permet de revenir avec un regard neuf, plus attentif aux détails.\n\n- Relisez à voix haute pour entendre le rythme.\n- Faites une passe pour le sens, puis une autre pour l’orthographe.\n- Vérifiez les mots que vous employez par habitude.\n\n> Relire, c’est aussi prendre soin de la personne qui vous lira.\n\nDans mes prochains articles, je partagerai d’autres conseils pour rendre vos textes plus clairs et plus justes.",
  cover_image_url: null,
  cover_image_source: null,
} satisfies Pick<BlogPost, "id" | "title" | "excerpt" | "content" | "cover_image_url" | "cover_image_source">;
