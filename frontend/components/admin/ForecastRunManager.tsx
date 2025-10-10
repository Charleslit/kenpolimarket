"use client";

import { useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type CountyInput = {
  county_code: string;
  registered_voters: number;
  turnout: number; // percent
  candidates: { name: string; party: string; votes: number }[];
};

export default function ForecastRunManager() {
  const [scenarioName, setScenarioName] = useState("Scenario Run");
  const [description, setDescription] = useState("");
  const [electionYear, setElectionYear] = useState(2027);
  const [electionType, setElectionType] = useState("Governor");
  const [countiesJson, setCountiesJson] = useState<string>(
    JSON.stringify(
      [
        {
          county_code: "45",
          registered_voters: 850000,
          turnout: 73,
          candidates: [
            { name: "Ezekiel Machogu", party: "UDA", votes: 343057 },
            { name: "Simba Arati", party: "ODM", votes: 277443 }
          ]
        }
      ],
      null,
      2
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const payloadPreview = useMemo(() => {
    try {
      const parsed: any[] = JSON.parse(countiesJson);
      if (!Array.isArray(parsed)) return null;

      const counties = parsed.map((c: any) => {
        const candArr: any[] = Array.isArray(c.candidates) ? c.candidates : [];
        const hasShares = candArr.some((x: any) => typeof x.predicted_vote_share === 'number');
        const hasVotes = candArr.some((x: any) => typeof x.votes === 'number');
        let normalizedCandidates: any[] = [];
        if (hasShares) {
          normalizedCandidates = candArr.map((x: any) => ({
            name: x.name,
            predicted_vote_share: Number(x.predicted_vote_share),
          }));
        } else if (hasVotes) {
          const totalVotes = candArr.reduce((s: number, x: any) => s + (Number(x.votes) || 0), 0) || 0;
          normalizedCandidates = candArr.map((x: any) => ({
            name: x.name,
            predicted_vote_share: totalVotes > 0 ? (Number(x.votes) / totalVotes) * 100 : 0,
          }));
        } else {
          // Neither shares nor votes present
          normalizedCandidates = candArr;
        }
        return {
          county_code: String(c.county_code),
          registered_voters: c.registered_voters != null ? Number(c.registered_voters) : undefined,
          turnout: c.turnout != null ? Number(c.turnout) : undefined,
          candidates: normalizedCandidates,
        };
      });

      return {
        election_year: Number(electionYear),
        election_type: electionType,
        scenario_name: scenarioName,
        description,
        counties,
      };
    } catch (e) {
      return null;
    }
  }, [countiesJson, electionYear, electionType, scenarioName, description]);

  async function submitRun() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/forecasts/scenario/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadPreview),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed: ${res.status} ${t}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to create run");
    } finally {
      setSubmitting(false);
    }
  }

  const deepLink = result?.forecast_run_id
    ? `/forecasts?run_id=${result.forecast_run_id}`
    : null;

  const isJsonValid = !!payloadPreview;

  return (
    <div className="bg-white rounded-2xl shadow-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Forecast Run Manager</h2>
        <span className="text-xs text-gray-500">Create runs for one or many counties</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4 md:col-span-1">
          <div>
            <label className="block text-sm font-medium mb-1">Scenario name</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Election year</label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={electionYear}
              onChange={(e) => setElectionYear(parseInt(e.target.value, 10) || 2027)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Election type</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={electionType}
              onChange={(e) => setElectionType(e.target.value)}
            >
              <option>Governor</option>
              <option>Presidential</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description / Assumptions</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about alignment, coalitions, data sources, etc."
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium mb-1">Counties JSON</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 font-mono text-sm h-64"
            value={countiesJson}
            onChange={(e) => setCountiesJson(e.target.value)}
            spellCheck={false}
          />
          <p className="text-xs text-gray-500">
            Format: [{'{' } county_code, registered_voters, turnout, candidates: [{'{' } name, party, votes {'}'}] {'}'}]
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={submitRun}
          disabled={!isJsonValid || submitting}
          className={`px-4 py-2 rounded-md text-white ${
            isJsonValid ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
          }`}
        >
          {submitting ? "Creating..." : "Create Forecast Run"}
        </button>
        {deepLink && (
          <a
            href={deepLink}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            target="_blank"
          >
            Open Run in Forecasts
          </a>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
            <div>Created run: <span className="font-mono">{result.forecast_run_id}</span></div>
            <div>Counties included: {result.counties_included}</div>
            <div>Rows created: {result.rows_created}</div>
          </div>
          <div className="text-xs text-gray-600">New runs are created as <span className="font-semibold">Draft</span>. Publish or set as Official when ready.</div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const r = await fetch(`${API_BASE_URL}/forecasts/${result.forecast_run_id}/publish`, { method: 'PATCH' });
                  if (!r.ok) throw new Error('Failed to publish');
                  alert('Published! Visible to all users in selector.');
                } catch (e) { alert((e as Error).message); }
              }}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Publish Scenario
            </button>
            <button
              onClick={async () => {
                if (!confirm('Set this run as the Official baseline for all users?')) return;
                try {
                  const r = await fetch(`${API_BASE_URL}/forecasts/${result.forecast_run_id}/official`, { method: 'PATCH' });
                  if (!r.ok) throw new Error('Failed to set official');
                  alert('Set as Official baseline!');
                } catch (e) { alert((e as Error).message); }
              }}
              className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Set as Official Baseline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

