"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

  const [lastRunId, setLastRunId] = useState<string | null>(null);

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

  // Load preset projection based on provided Kisii breakdown (2027)
  const loadKisiiProjection = () => {
    // From user's projection: Registered 850,000, Turnout 73%
    setRegistered(850000);
    setTurnoutPct(73);

    // Aggregate constituency pairs into our combined blocs
    // Nyaribari: Chache + Masaba, Kitutu: South + North, Bomachoge: Borabu + Chache
    setMachogu({
      nyaribari: 122_353,
      kitutu: 105_055,
      bonchari: 25_192,
      bomachoge: 36_222,
      south_mugirango: 53_903,
      bobasi: 10_313,
    });

    setArati({
      nyaribari: 30_588,
      kitutu: 15_697,
      bonchari: 37_789,
      bomachoge: 67_268,
      south_mugirango: 23_101,
      bobasi: 93_000,
    });
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
        { name: "Ezekiel Machogu", party: "UDA", votes: scaled.machogu, predicted_vote_share: shares.machogu },
        { name: "Simba Arati", party: "ODM", votes: scaled.arati, predicted_vote_share: shares.arati },
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
      const out = await applyToForecasts();
      // Try to extract a run id for deep-linking
      const runId = out?.run?.id || out?.forecast_run?.id || out?.run_id || (Array.isArray(out?.forecasts) && out.forecasts[0]?.forecast_run_id) || null;
      if (runId) setLastRunId(runId);
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

      {/* Quick preset */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-lg">
        <div className="text-sm">Preset: Kisii 2027 – Arati vs Machogu (from your brief)</div>
        <button
          type="button"
          onClick={loadKisiiProjection}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold"
        >
          Load Projection
        </button>
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

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleApply}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Apply to Forecasts (Kisii)
        </button>
        <a
          href="/forecasts?county=45"
          className="px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Open Forecasts
        </a>
        {lastRunId && (
          <>
            <a
              href={`/forecasts?county=45&run_id=${lastRunId}`}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open This Projection
            </a>
            <div className="w-full mt-2 text-sm">
              <div className="text-gray-600 mb-2">This scenario was saved as a Draft run. You can publish or set it as Official:</div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API_BASE_URL}/forecasts/${lastRunId}/publish`, { method: 'PATCH' });
                      if (!r.ok) throw new Error('Failed to publish');
                      alert('Published! Visible to all users in selector.');
                    } catch (e) { alert((e as Error).message); }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Publish Scenario
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Set this run as the Official baseline for all users?')) return;
                    try {
                      const r = await fetch(`${API_BASE_URL}/forecasts/${lastRunId}/official`, { method: 'PATCH' });
                      if (!r.ok) throw new Error('Failed to set official');
                      alert('Set as Official baseline!');
                    } catch (e) { alert((e as Error).message); }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Set as Official Baseline
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

