import type { TimerState } from "../../types";
import { formatDurationTimer } from "../../lib/format";

interface TimerDisplayProps {
  elapsedSecs: number;
  state: TimerState;
  taskName: string | null;
}

const STATE_STYLES: Record<TimerState, string> = {
  idle: "text-zinc-500",
  running: "text-emerald-400",
  paused: "text-amber-400",
};

const STATE_LABELS: Record<TimerState, string> = {
  idle: "Ready",
  running: "Running",
  paused: "Paused",
};

export function TimerDisplay({
  elapsedSecs,
  state,
  taskName,
}: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <span
        className={`font-mono text-7xl font-bold tabular-nums ${STATE_STYLES[state]}`}
      >
        {formatDurationTimer(elapsedSecs)}
      </span>
      <div className="flex flex-col items-center gap-1">
        {taskName && (
          <p className="text-lg text-zinc-300">{taskName}</p>
        )}
        <p
          className={`text-sm font-medium ${STATE_STYLES[state]}`}
        >
          {STATE_LABELS[state]}
        </p>
      </div>
    </div>
  );
}
