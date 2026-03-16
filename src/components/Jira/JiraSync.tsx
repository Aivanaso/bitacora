import type { PendingSync } from "../../types";
import { JiraPending } from "./JiraPending";

interface JiraSyncProps {
  pending: PendingSync[];
  connectionOk: boolean | null;
  onSync: (timeEntryId: string, durationOverride?: number) => Promise<void>;
  onTestConnection: () => void;
  loading: boolean;
}

export function JiraSync({
  pending,
  connectionOk,
  onSync,
  onTestConnection,
  loading,
}: JiraSyncProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Jira Sync</h2>
        <div className="flex items-center gap-3">
          {connectionOk !== null && (
            <span
              className={`text-xs font-medium ${
                connectionOk ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {connectionOk ? "Connected" : "Disconnected"}
            </span>
          )}
          <button
            onClick={onTestConnection}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Test Connection
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading...</p>
      ) : (
        <JiraPending items={pending} onSync={onSync} />
      )}
    </div>
  );
}
