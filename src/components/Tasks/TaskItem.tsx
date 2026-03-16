import type { Task, TrackedTask } from "../../types";
import { formatDuration } from "../../lib/format";

interface TaskItemProps {
  task: Task;
  tracked: TrackedTask | undefined;
  onStart: (taskId: string) => void;
  onStop: (taskId: string) => void;
  onArchive: (taskId: string) => void;
}

export function TaskItem({
  task,
  tracked,
  onStart,
  onStop,
  onArchive,
}: TaskItemProps) {
  const isRunning = tracked?.state === "running";
  const isPaused = tracked?.state === "paused";
  const hasTimer = isRunning || isPaused;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
        isRunning
          ? "border-emerald-500/40 bg-emerald-500/10"
          : isPaused
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-zinc-700 bg-zinc-800"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {task.jira_ticket && (
            <span className="inline-block rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {task.jira_ticket}
            </span>
          )}
          {hasTimer && (
            <span
              className={`font-mono text-xs font-medium ${
                isRunning ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {formatDuration(tracked.elapsed_secs)}
              {isPaused && " (paused)"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={() => onStop(task.id)}
            className="rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            Stop
          </button>
        ) : (
          <>
            <button
              onClick={() => onStart(task.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isPaused
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              }`}
            >
              {isPaused ? "Resume" : "Play"}
            </button>
            {isPaused && (
              <button
                onClick={() => onStop(task.id)}
                className="rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
              >
                Stop
              </button>
            )}
          </>
        )}

        <button
          onClick={() => onArchive(task.id)}
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-red-400"
          title="Archive task"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
