"use client";

import { useEffect, useState } from "react";
import { readStore, type StoreState } from "../store";

const EMPTY: StoreState = { tests: [], blockLogs: [] };

export function useStore(): { state: StoreState; hydrated: boolean } {
  const [state, setState] = useState<StoreState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(readStore());
    sync();
    setHydrated(true);
    window.addEventListener("testall:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("testall:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { state, hydrated };
}
