"use client";

import { useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type BlocKey = "nyaribari" | "kitutu" | "bonchari" | "bomachoge" | "south_mugirango" | "bobasi";

const BLOC_LABELS: Record<BlocKey, string> = {
  nyaribari: "Nyaribari (combined)",
  kitutu: "Kitutu (combined)",
  bonchari: "Bonchari",
  bomachoge: "Bomachoge (combined)",
  south_mugirango: "South Mugirango",
  bobasi: "Bobasi",
};

export default function CountyScenarioCalculator() {
  // Defaults based on your inputs
  const [registered, setRegistered] = useState<number>(637_000);
  const [turnoutPct, setTurnoutPct] = useState<number>(60);

  // Machogu coalition bloc inputs (votes before normalization)
  const [machogu, setMachogu] = useState<Record<BlocKey, number>>({
    nyaribari: 50_000,
    kitutu: 40_000,
    bonchari: 15_000,
    bomachoge: 20_000,
    south_mugirango: 50_000,
    bobasi: 0,
  });

  // Arati bloc inputs (votes before normalization)
  const [arati, setArati] = useState<Record<BlocKey, number>>({
    nyaribari: 15_000,
    kitutu: 10_000,
    bonchari: 30_000,
    bomachoge: 20_000,
    south_mugirango: 10_000,
    bobasi: 40_000,
  });

  const baseTotal = useMemo(() => {
    const m = Object.values(machogu).reduce((a, b) => a + b, 0);
    const a = Object.values(arati).reduce((a, b) => a + b, 0);
    return { m, a, total: m + a };
  }, [machogu, arati]);

  const turnoutTotal = useMemo(() => Math.max(0, Math.round(registered * (turnoutPct / 100))), [registered, turnoutPct]);
  const scale = useMemo(() => (baseTotal.total > 0 ? turnoutTotal / baseTotal.total : 0), [turnoutTotal, baseTotal.total]);

  const scaled = {
    machogu: Math.round(baseTotal.m * scale),
    arati: Math.round(baseTotal.a * scale),
  };
  const shares = {
    machogu: turnoutTotal > 0 ? (scaled.machogu / turnoutTotal) * 100 : 0,
    arati: turnoutTotal > 0 ? (scaled.arati / turnoutTotal) * 100 : 0,
  };

  const winner = shares.machogu === shares.arati ? "Tie" : shares.machogu > shares.arati ? "Ezekiel Machogu (UDA)" : "Simba Arati (ODM)";
  const marginPct = Math.abs(shares.machogu - shares.arati);

  const updateBloc = (
    who: "machogu" | "arati",
    key: BlocKey,
    value: number
  ) => {
    if (who === "machogu") setMachogu((prev) => ({ ...prev, [key]: value }));
    else setArati((prev) => ({ ...prev, [key]: value }));
  };

  const applyToForecasts = async () => {
    // POST to backend to seed a new forecast run for Kisii only
    const payload = {
      county_code: "45", // Kisii
      election_year: 2027,
      election_type: "Governor",
      scenario_name: "Kisii Governor – Machogu vs Arati (admin scenario)",
      registered_voters: registered,
      turnout: turnoutPct,
      candidates: [
        { name: "Ezekiel Machogu", party: "UDA", votes: scaled.machogu },
        { name: "Simba Arati", party: "ODM", votes: scaled.arati },
      ],
    };

    const res = await fetch(`${API_BASE_URL}/forecasts/scenario/county`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to apply scenario");
    }

    return res.json();
  };

  const handleApply = async () => {
    try {
      await applyToForecasts();
      alert("Scenario applied. Open the Forecasts page and select Kisii to see the update.");
    } catch (e: any) {
      alert(e.message || "Failed to apply scenario");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">County Scenario (Kisii Governor)</h3>
        <p className="text-sm text-gray-500 mt-1">Enter bloc-level votes for two candidates, set turnout, and push to forecasts.</p>
      </div>

      {/* Turnout + Registered */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
          <input disabled value="Kisii (Code 45)" className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registered Voters</label>
          <input
            type="number"
            value={registered}
            onChange={(e) => setRegistered(parseInt(e.target.value || "0"))}
            className="w-full px-3 py-2 border rounded-lg"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turnout (%)</label>
          <input
            type="number"
            step="0.1"
            value={turnoutPct}
            onChange={(e) => setTurnoutPct(parseFloat(e.target.value || "0"))}
            className="w-full px-3 py-2 border rounded-lg"
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Bloc inputs */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(BLOC_LABELS) as BlocKey[]).map((key) => (
            <div key={key} className="p-3 border rounded-lg">
              <div className="font-medium text-gray-900 mb-2">{BLOC_LABELS[key]}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Machogu (votes)</label>
                  <input
                    type="number"
                    value={machogu[key]}
                    onChange={(e) => updateBloc("machogu", key, parseInt(e.target.value || "0"))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Arati (votes)</label>
                  <input
                    type="number"
                    value={arati[key]}
                    onChange={(e) => updateBloc("arati", key, parseInt(e.target.value || "0"))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Base Totals (before normalization)</div>
            <div className="mt-1">Machogu: <strong>{baseTotal.m.toLocaleString()}</strong></div>
            <div>Arati: <strong>{baseTotal.a.toLocaleString()}</strong></div>
            <div>Total: <strong>{baseTotal.total.toLocaleString()}</strong></div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Turnout Target</div>
            <div className="mt-1">Projected Votes: <strong>{turnoutTotal.toLocaleString()}</strong></div>
            <div>Scale Factor: <strong>{scale.toFixed(3)}</strong></div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Normalized Projection</div>
            <div className="mt-1">Machogu: <strong>{scaled.machogu.toLocaleString()}</strong> ({shares.machogu.toFixed(1)}%)</div>
            <div>Arati: <strong>{scaled.arati.toLocaleString()}</strong> ({shares.arati.toFixed(1)}%)</div>
            <div className="mt-1">Winner: <strong>{winner}</strong> by <strong>{marginPct.toFixed(1)}%</strong></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleApply}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Apply to Forecasts (Kisii)
        </button>
        <a
          href="/forecasts"
          className="px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Open Forecasts
        </a>
      </div>
    </div>
  );
}

