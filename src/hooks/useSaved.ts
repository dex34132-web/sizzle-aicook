import { useCallback, useEffect, useState } from "react";

const KEY = "savour:saved";

export function useSaved() {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids]);

  // Sync across tabs / settings clear
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setIds(JSON.parse(e.newValue || "[]"));
        } catch {
          setIds([]);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const clearAll = useCallback(() => setIds([]), []);

  return { ids, isSaved, toggle, clearAll };
}
