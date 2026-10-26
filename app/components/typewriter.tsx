"use client";
import { useEffect, useState } from "react";
import { cutive } from "@/app/fonts";

export default function Typewriter() {
  const text = "Au mot juste";
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setCurrentText(text));
      return () => cancelAnimationFrame(frame);
    }

    let i = 0;
    const interval = setInterval(() => {
      setCurrentText(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 180);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`${cutive.className} text-4xl md:text-5xl font-normal mb-2 text-gray-800 whitespace-nowrap`}
    >
      {currentText}
      <span className="ml-0.5 animate-blink">|</span>
    </div>
  );
}
