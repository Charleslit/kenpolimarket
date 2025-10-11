"use client";

import React from "react";
import { useForecastRun } from "@/contexts/ForecastRunContext";

export default function RunSelector() {
  const { runs, selectedRunId, setSelectedRunId, runDetails, isLoading } = useForecastRun();

  return (
    <div className="flex items-center gap-2">
      {/* Compact dropdown */}
      <select
        className="max-w-[260px] md:max-w-xs truncate text-ellipsis block rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={selectedRunId || ""}
        onChange={(e) => setSelectedRunId(e.target.value || null)}
        aria-label="Select forecast run"
        disabled={isLoading}
        title={selectedRunId ? (runDetails?.model_name || "Scenario") : "Official Baseline (Default)"}
      >
        <option value="">Official Baseline (Default)</option>
        {runs.map((run) => (
          <option key={run.id} value={run.id}>
            {(run.model_name || "Scenario")} {run.run_timestamp ? `- ${new Date(run.run_timestamp).toLocaleString()}` : ""}
          </option>
        ))}
      </select>

      {/* Info hover card */}
      {selectedRunId && runDetails && (
        <div className="relative group">
          <button
            className="text-gray-500 hover:text-gray-700 text-sm"
            aria-label="Run details"
            title="Scenario details"
            type="button"
          >
            ℹ️
          </button>
          <div className="hidden group-hover:block absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
            <div className="text-sm font-semibold text-gray-900">{runDetails.model_name || "Scenario"}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {runDetails?.election?.year} {runDetails?.election?.election_type}
            </div>
            {/* Description from parameters or details if available */}
            {(() => {
              const p = runDetails?.parameters;
              const desc = (p && (p.description || p.notes)) || (runDetails as any)?.description;
              return desc ? <p className="text-sm text-gray-700 mt-2 line-clamp-4">{desc}</p> : null;
            })()}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Counties: —</span>
              <span>{runDetails?.run_timestamp && new Date(runDetails.run_timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

