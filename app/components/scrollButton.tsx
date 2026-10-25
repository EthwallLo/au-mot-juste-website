"use client";

export default function ScrollButton() {
  const handleScroll = () => {
    const section = document.getElementById("decouvrir");

    if (!section) return;

    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
    const sectionHeight = section.offsetHeight;
    const windowHeight = window.innerHeight;

    const scrollTo = sectionTop - (windowHeight / 2) + (sectionHeight / 2);

    window.scrollTo({
      top: scrollTo,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      aria-label="Aller à la section Pourquoi faire appel à une correctrice-relectrice"
      onClick={handleScroll}
      className="px-6 py-3 bg-gray-50 text-gray-800 rounded-md font-medium hover:scale-105 transition transform"
    >
      Découvrir ↓
    </button>
  );
}
