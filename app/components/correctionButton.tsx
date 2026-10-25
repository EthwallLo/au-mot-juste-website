import Link from "next/link";

export default function CorrectionButton() {
  return (
    <Link
      href="/correction"
      className="mt-4 inline-flex px-6 py-3 bg-brand-strong text-white rounded-md hover:bg-brand-hover transition-colors duration-300"
    >
      En savoir plus
    </Link>
  );
}
