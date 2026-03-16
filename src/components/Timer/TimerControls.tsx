import type { TimerState } from "../../types";

interface TimerControlsProps {
  state: TimerState;
  hasTrackedTasks: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStopAll: () => void;
}

export function TimerControls({
  state,
  hasTrackedTasks,
  onPause,
  onResume,
  onStop,
  onStopAll,
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {state === "running" && (
        <button
          onClick={onPause}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          Pause
        </button>
      )}

      {state === "paused" && (
        <button
          onClick={onResume}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Resume
        </button>
      )}

      {(state === "running" || state === "paused") && (
        <button
          onClick={onStop}
          className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          Stop
        </button>
      )}

      {hasTrackedTasks && (
        <button
          onClick={onStopAll}
          className="rounded-lg border border-red-500/40 px-6 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          Stop All
        </button>
      )}

      {state === "idle" && !hasTrackedTasks && (
        <p className="text-sm text-zinc-500">
          Select a task to start tracking
        </p>
      )}
    </div>
  );
}
