import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialRoasts, type Roast } from "~/lib/roasts";

type RoastContextValue = {
  roasts: Roast[];
  toggleStar: (id: string) => void;
  deleteRoasts: (ids: string[]) => void;
};

const RoastContext = createContext<RoastContextValue | null>(null);
const storageKey = "marosa-roasts-v2";

export function RoastProvider({ children }: { children: ReactNode }) {
  const [roasts, setRoasts] = useState<Roast[]>(initialRoasts);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setRoasts(JSON.parse(saved) as Roast[]);
    } catch {
      // Keep bundled demo data when local storage is unavailable or invalid.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(roasts));
  }, [ready, roasts]);

  const value = useMemo<RoastContextValue>(() => ({
    roasts,
    toggleStar(id) {
      setRoasts((current) => current.map((roast) => roast.id === id ? { ...roast, starred: !roast.starred } : roast));
    },
    deleteRoasts(ids) {
      setRoasts((current) => current.filter((roast) => !ids.includes(roast.id)));
    },
  }), [roasts]);

  return <RoastContext.Provider value={value}>{children}</RoastContext.Provider>;
}

export function useRoasts() {
  const context = useContext(RoastContext);
  if (!context) throw new Error("useRoasts must be used within RoastProvider");
  return context;
}
