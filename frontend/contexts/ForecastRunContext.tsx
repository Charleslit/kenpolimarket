"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type ForecastRun = {
  id: string;
  model_name?: string;
  run_timestamp?: string;
  parameters?: any;
  election?: { year?: number; election_type?: string };
  visibility?: string;
  is_official?: boolean;
  published_at?: string | null;
};

interface ForecastRunContextValue {
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;
  runDetails: ForecastRun | null;
  runs: ForecastRun[];
  isLoading: boolean;
  refreshRuns: () => Promise<void>;
}

const ForecastRunContext = createContext<ForecastRunContextValue | undefined>(undefined);

export function ForecastRunProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [runs, setRuns] = useState<ForecastRun[]>([]);
  const [selectedRunId, setSelectedRunIdState] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<ForecastRun | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize from URL first, then localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const runParam = sp.get("run_id");
      const stored = localStorage.getItem("selectedRunId");
      const init = runParam || stored || null;
      if (init) setSelectedRunIdState(init);
    } catch {}
  }, []);

  // Persist selection to URL and localStorage, preserving other params
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (selectedRunId) {
        sp.set("run_id", selectedRunId);
        localStorage.setItem("selectedRunId", selectedRunId);
      } else {
        sp.delete("run_id");
        localStorage.removeItem("selectedRunId");
      }
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    } catch {}
  }, [selectedRunId, router, pathname]);

  // Fetch published/official runs
  const refreshRuns = useMemo(
    () => async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/forecasts/`);
        if (res.ok) {
          const data = await res.json();
          setRuns(Array.isArray(data) ? data : []);
        }
      } catch {}
      finally { setIsLoading(false); }
    },
    []
  );

  useEffect(() => { refreshRuns(); }, [refreshRuns]);

  // Fetch selected run details
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedRunId) { setRunDetails(null); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/forecasts/${selectedRunId}`);
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setRunDetails(d);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [selectedRunId]);

  const value = useMemo<ForecastRunContextValue>(() => ({
    selectedRunId,
    setSelectedRunId: setSelectedRunIdState,
    runDetails,
    runs,
    isLoading,
    refreshRuns,
  }), [selectedRunId, runDetails, runs, isLoading, refreshRuns]);

  return (
    <ForecastRunContext.Provider value={value}>{children}</ForecastRunContext.Provider>
  );
}

export function useForecastRun(): ForecastRunContextValue {
  const ctx = useContext(ForecastRunContext);
  if (!ctx) throw new Error("useForecastRun must be used within ForecastRunProvider");
  return ctx;
}

