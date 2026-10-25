"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "site-text-size";
const TEXT_SIZE_EVENT = "text-size-change";

const textSizes = [
  { id: "small", label: "A-", ariaLabel: "Réduire la taille du texte" },
  { id: "normal", label: "A", ariaLabel: "Taille de texte normale" },
  { id: "large", label: "A+", ariaLabel: "Augmenter la taille du texte" },
] as const;

type TextSizeId = (typeof textSizes)[number]["id"];

function isTextSizeId(value: string | null): value is TextSizeId {
  return textSizes.some((size) => size.id === value);
}

function getStoredTextSize(): TextSizeId {
  const storedSize = window.localStorage.getItem(STORAGE_KEY);

  return isTextSizeId(storedSize) ? storedSize : "normal";
}

function applyTextSize(size: TextSizeId) {
  document.documentElement.dataset.textSize = size;
}

function getServerSnapshot(): TextSizeId {
  return "normal";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TEXT_SIZE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TEXT_SIZE_EVENT, onStoreChange);
  };
}

export default function TextSizeControls() {
  const activeSize = useSyncExternalStore(
    subscribe,
    getStoredTextSize,
    getServerSnapshot
  );

  useEffect(() => {
    applyTextSize(activeSize);
  }, [activeSize]);

  const handleChange = (size: TextSizeId) => {
    applyTextSize(size);
    window.localStorage.setItem(STORAGE_KEY, size);
    window.dispatchEvent(new Event(TEXT_SIZE_EVENT));
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      <div
        role="group"
        aria-label="Réglage de la taille du texte"
        className="flex items-center gap-1 rounded-full border border-[#d7bcc1] bg-white/90 p-1 shadow-lg shadow-[#B76E79]/10 backdrop-blur-sm"
      >
        {textSizes.map((size) => {
          const isActive = activeSize === size.id;

          return (
            <button
              key={size.id}
              type="button"
              aria-label={size.ariaLabel}
              aria-pressed={isActive}
              title={size.ariaLabel}
              onClick={() => handleChange(size.id)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold transition sm:h-10 sm:min-w-10 ${
                isActive
                  ? "bg-brand-strong text-white shadow-sm"
                  : "text-brand-strong hover:bg-[#f6ecee]"
              }`}
            >
              {size.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
