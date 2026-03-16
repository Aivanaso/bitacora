import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerStatus, TrackedTask } from "../types";
import * as tauri from "../lib/tauri";

const IDLE_STATUS: TimerStatus = {
  state: "idle",
  task_id: null,
  elapsed_secs: 0,
};

export function useTimer() {
  const [status, setStatus] = useState<TimerStatus>(IDLE_STATUS);
  const [trackedTasks, setTrackedTasks] = useState<TrackedTask[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const [s, tracked] = await Promise.all([
        tauri.getTimerStatus(),
        tauri.getTrackedTasks(),
      ]);
      setStatus(s);
      setTrackedTasks(tracked);
    } catch {
      setStatus(IDLE_STATUS);
      setTrackedTasks([]);
    }
  }, []);

  useEffect(() => {
    poll();
  }, [poll]);

  useEffect(() => {
    // Poll every second if any timer is tracked (running or paused)
    const hasActiveTimers =
      status.state === "running" || trackedTasks.length > 0;

    if (hasActiveTimers) {
      intervalRef.current = setInterval(poll, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status.state, trackedTasks.length, poll]);

  const start = useCallback(
    async (taskId: string) => {
      await tauri.startTimer(taskId);
      await poll();
    },
    [poll],
  );

  const pause = useCallback(async () => {
    await tauri.pauseTimer();
    await poll();
  }, [poll]);

  const resume = useCallback(
    async (taskId?: string) => {
      await tauri.resumeTimer(taskId);
      await poll();
    },
    [poll],
  );

  const stop = useCallback(
    async (taskId?: string) => {
      await tauri.stopTimer(taskId);
      await poll();
    },
    [poll],
  );

  const stopAll = useCallback(async () => {
    await tauri.stopAllTimers();
    await poll();
  }, [poll]);

  return { status, trackedTasks, start, pause, resume, stop, stopAll };
}
