"use client";

import { useCallback, useEffect, useState } from "react";

export type GuestLanguage = "id" | "en";

const STORAGE_KEY = "guest-lang";
const EVENT_NAME = "guest-lang-change";

function readStored(): GuestLanguage | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "id" || v === "en" ? v : null;
}

// Shared across template + DisposableCamera so switching language in one
// place is reflected everywhere, even though they're sibling components.
export function useGuestLanguage(defaultLang: GuestLanguage = "id") {
  const [lang, setLangState] = useState<GuestLanguage>(() => readStored() ?? defaultLang);

  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== lang) setLangState(stored);

    function onChange(e: Event) {
      const detail = (e as CustomEvent<GuestLanguage>).detail;
      if (detail === "id" || detail === "en") setLangState(detail);
    }
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: GuestLanguage | ((prev: GuestLanguage) => GuestLanguage)) => {
    setLangState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, resolved);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: resolved }));
      }
      return resolved;
    });
  }, []);

  return [lang, setLang] as const;
}
