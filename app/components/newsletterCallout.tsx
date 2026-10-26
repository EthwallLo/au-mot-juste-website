import NewsletterSignup from "./newsletterSignup";

export default function NewsletterCallout() {
  return <section id="newsletter" aria-label="Recevoir les articles par e-mail" className="scroll-mt-28 bg-white px-4 py-10 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <NewsletterSignup />
    </div>
  </section>;
}
