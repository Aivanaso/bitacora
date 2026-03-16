import type { DailyReport } from "../../types";
import { formatDuration, formatTime } from "../../lib/format";

interface DailyViewProps {
  report: DailyReport | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function DailyView({
  report,
  selectedDate,
  onDateChange,
  onRefresh,
  loading,
}: DailyViewProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Daily Report</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading...</p>
      ) : !report || report.entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No entries for this date.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-400">Task</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Ticket</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Start</th>
                <th className="px-4 py-3 font-medium text-zinc-400">End</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-zinc-700/50 last:border-0"
                >
                  <td className="px-4 py-2.5 text-zinc-200">
                    {entry.task_title}
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.jira_ticket ? (
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                        {entry.jira_ticket}
                      </span>
                    ) : (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-300">
                    {formatTime(entry.started_at)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-300">
                    {entry.ended_at ? formatTime(entry.ended_at) : "--:--"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                    {entry.duration_secs
                      ? formatDuration(entry.duration_secs)
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-600 bg-zinc-800/50">
                <td
                  colSpan={4}
                  className="px-4 py-3 font-medium text-zinc-300"
                >
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                  {formatDuration(report.total_secs)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
