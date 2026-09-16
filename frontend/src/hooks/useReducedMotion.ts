import { useEffect, useState } from "react";

export type ReducedMotionOverride = "on" | "off" | null;

const STORAGE_KEY = "docme360.reducedMotionOverride";

function readOverride(): ReducedMotionOverride {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Combines the OS-level `prefers-reduced-motion` media query with an
 * optional in-app override, so someone whose OS setting doesn't reflect
 * their preference (or who can't easily change it) still has a way to
 * control animation here. The override is a per-device convenience, not
 * data that needs to sync across devices or be read by anyone else, so
 * `localStorage` is the right place for it rather than a backend field.
 */
export function useReducedMotion(): { effective: boolean; osPrefers: boolean; override: ReducedMotionOverride; setOverride: (value: ReducedMotionOverride) => void } {
  const [osPrefers, setOsPrefers] = useState(false);
  const [override, setOverrideState] = useState<ReducedMotionOverride>(() => readOverride());

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsPrefers(query.matches);
    const listener = (e: MediaQueryListEvent) => setOsPrefers(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  function setOverride(value: ReducedMotionOverride) {
    setOverrideState(value);
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Private browsing / blocked storage — override just won't persist.
    }
  }

  const effective = override === "on" ? true : override === "off" ? false : osPrefers;
  return { effective, osPrefers, override, setOverride };
}
