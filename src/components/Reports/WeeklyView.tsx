import type { WeeklyReport } from "../../types";
import {
  formatDuration,
  formatTime,
  formatDate,
  getWeekStart,
  toDateString,
} from "../../lib/format";

interface WeeklyViewProps {
  report: WeeklyReport | null;
  selectedWeek: string;
  onWeekChange: (startDate: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function WeeklyView({
  report,
  selectedWeek,
  onWeekChange,
  onRefresh,
  loading,
}: WeeklyViewProps) {
  function navigateWeek(offset: number) {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + offset * 7);
    const monday = getWeekStart(current);
    onWeekChange(toDateString(monday));
  }

  const weekEnd = new Date(selectedWeek);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Weekly Report</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          >
            &larr; Prev
          </button>
          <span className="text-sm text-zinc-300">
            {formatDate(selectedWeek)} &ndash;{" "}
            {formatDate(weekEnd.toISOString())}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          >
            Next &rarr;
          </button>
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
      ) : !report || report.tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No entries for this week.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {report.tasks.map((taskGroup) => (
            <div
              key={taskGroup.task_id}
              className="rounded-lg border border-zinc-700 bg-zinc-800"
            >
              <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-200">
                    {taskGroup.task_title}
                  </span>
                  {taskGroup.jira_ticket && (
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                      {taskGroup.jira_ticket}
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-medium text-emerald-400">
                  {formatDuration(taskGroup.total_secs)}
                </span>
              </div>

              <div className="divide-y divide-zinc-700/50 px-4">
                {taskGroup.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-zinc-400">
                      {formatDate(entry.started_at)}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {formatTime(entry.started_at)}
                      {" - "}
                      {entry.ended_at ? formatTime(entry.ended_at) : "--:--"}
                    </span>
                    <span className="font-mono text-zinc-300">
                      {entry.duration_secs
                        ? formatDuration(entry.duration_secs)
                        : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg bg-zinc-800 px-4 py-3">
            <span className="font-medium text-zinc-200">Grand Total</span>
            <span className="font-mono text-lg font-bold text-emerald-400">
              {formatDuration(report.total_secs)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
