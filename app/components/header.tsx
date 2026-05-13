"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavLink from "./navlink";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      role="banner"
      className={
        "fixed top-0 left-0 w-full py-4 z-50 transition-all duration-300 " +
        (scrolled || open
          ? "bg-white shadow-sm"
          : "bg-white/15 backdrop-blur-md")
      }
    >
      <nav
        aria-label="Navigation principale"
        className="w-full flex justify-between items-center px-4 relative"
      >
        <Link href="/" aria-label="Au mot juste, revenir à l'accueil">
          <Image
            src="/logo-moderne.svg"
            alt="Au mot juste"
            width={140}
            height={80}
          />
        </Link>

        <ul className="hidden lg:flex space-x-8 text-gray-800 text-lg ml-auto">
          <li>
            <NavLink href="/">Accueil</NavLink>
          </li>
          <li>
            <NavLink href="/correction">Correction</NavLink>
          </li>
          <li>
            <NavLink href="/traduction">Traduction</NavLink>
          </li>
          <li>
            <NavLink href="/qui-suis-je">Qui suis-je</NavLink>
          </li>
          <li>
            <NavLink href="/blog">Blog</NavLink>
          </li>
          <li>
            <NavLink href="/contact">Contact</NavLink>
          </li>
        </ul>

        <Link
          href="https://www.linkedin.com/in/lorena-guedouani/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profil LinkedIn de Lorena Guedouani, ouverture dans un nouvel onglet"
          className="hidden lg:block ml-50"
        >
          <Image
            src="/linkedin.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="hover:opacity-70 transition"
          />
        </Link>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="lg:hidden text-gray-800"
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {open && (
        <div
          id="menu-mobile"
          className="lg:hidden bg-white text-gray-800 shadow-md p-6 text-lg"
        >
          <ul className="flex flex-col space-y-4">
            <li>
              <NavLink href="/" onClick={() => setOpen(false)}>
                Accueil
              </NavLink>
            </li>
            <li>
              <NavLink href="/correction" onClick={() => setOpen(false)}>
                Correction
              </NavLink>
            </li>
            <li>
              <NavLink href="/traduction" onClick={() => setOpen(false)}>
                Traduction
              </NavLink>
            </li>
            <li>
              <NavLink href="/qui-suis-je" onClick={() => setOpen(false)}>
                Qui suis-je
              </NavLink>
            </li>
            <li>
              <NavLink href="/blog" onClick={() => setOpen(false)}>
                Blog
              </NavLink>
            </li>
            <li>
              <NavLink href="/contact" onClick={() => setOpen(false)}>
                Contact
              </NavLink>
            </li>
            <li>
              <Link
                href="https://www.linkedin.com/in/lorena-guedouani/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Profil LinkedIn de Lorena Guedouani, ouverture dans un nouvel onglet"
                className="inline-flex pt-4"
              >
                <Image
                  src="/linkedin.svg"
                  width={30}
                  height={30}
                  alt=""
                  aria-hidden="true"
                />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
