import { useState } from "react";
import type { PendingSync } from "../../types";
import { formatDuration, formatDate, formatTime } from "../../lib/format";

interface JiraPendingProps {
  items: PendingSync[];
  onSync: (timeEntryId: string, durationOverride?: number) => Promise<void>;
}

export function JiraPending({ items, onSync }: JiraPendingProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  async function handleSync(item: PendingSync) {
    setSyncing(item.time_entry_id);
    try {
      const overrideStr = overrides[item.time_entry_id];
      const overrideSecs = overrideStr ? parseInt(overrideStr, 10) * 60 : undefined;
      await onSync(
        item.time_entry_id,
        overrideSecs && !isNaN(overrideSecs) ? overrideSecs : undefined,
      );
    } finally {
      setSyncing(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No pending syncs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.time_entry_id}
          className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
            item.synced
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-zinc-700 bg-zinc-800"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">
              {item.task_title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <span className="rounded bg-blue-500/20 px-2 py-0.5 font-medium text-blue-400">
                {item.jira_ticket}
              </span>
              <span>{formatDate(item.started_at)}</span>
              <span>{formatTime(item.started_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-sm text-zinc-300">
                {formatDuration(item.duration_secs)}
              </span>
              {!item.synced && (
                <input
                  type="number"
                  placeholder="min"
                  value={overrides[item.time_entry_id] ?? ""}
                  onChange={(e) =>
                    setOverrides((prev) => ({
                      ...prev,
                      [item.time_entry_id]: e.target.value,
                    }))
                  }
                  className="w-20 rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-right text-xs text-zinc-100 outline-none focus:border-emerald-500"
                  title="Override duration in minutes"
                />
              )}
            </div>

            {item.synced ? (
              <span className="text-emerald-400" title="Synced">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : (
              <button
                onClick={() => handleSync(item)}
                disabled={syncing === item.time_entry_id}
                className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {syncing === item.time_entry_id ? "..." : "Sync"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
