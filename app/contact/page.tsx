import ContactForm from "./ContactForm";
import { createPageMetadata } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Contact et devis gratuit | Au mot juste",
  description:
    "Demandez un devis gratuit pour la correction, la relecture ou la traduction anglais-français de votre document. Présentez votre projet à Lorena Guedouani.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactForm />;
}
