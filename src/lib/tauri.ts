import { invoke } from "@tauri-apps/api/core";
import type {
  TimerStatus,
  TrackedTask,
  Task,
  DailyReport,
  WeeklyReport,
  PendingSync,
} from "../types";

export async function startTimer(taskId: string): Promise<void> {
  await invoke("start_timer", { taskId });
}

export async function pauseTimer(): Promise<void> {
  await invoke("pause_timer");
}

export async function resumeTimer(taskId?: string): Promise<void> {
  await invoke("resume_timer", { taskId: taskId ?? null });
}

export async function stopTimer(taskId?: string): Promise<void> {
  await invoke("stop_timer", { taskId: taskId ?? null });
}

export async function getTrackedTasks(): Promise<TrackedTask[]> {
  return invoke<TrackedTask[]>("get_tracked_tasks");
}

export async function stopAllTimers(): Promise<void> {
  await invoke("stop_all_timers");
}

export async function getTimerStatus(): Promise<TimerStatus> {
  return invoke<TimerStatus>("get_timer_status");
}

export async function createTask(
  title: string,
  jiraTicket?: string,
): Promise<Task> {
  return invoke<Task>("create_task", { title, jiraTicket: jiraTicket ?? null });
}

export async function listTasks(includeArchived?: boolean): Promise<Task[]> {
  return invoke<Task[]>("list_tasks", {
    includeArchived: includeArchived ?? false,
  });
}

export async function updateTask(
  id: string,
  title?: string,
  jiraTicket?: string,
): Promise<Task> {
  return invoke<Task>("update_task", {
    id,
    title: title ?? null,
    jiraTicket: jiraTicket ?? null,
  });
}

export async function archiveTask(id: string): Promise<void> {
  await invoke("archive_task", { id });
}

export async function getDailyEntries(date: string): Promise<DailyReport> {
  return invoke<DailyReport>("get_daily_entries", { date });
}

export async function getWeeklyEntries(
  startDate: string,
): Promise<WeeklyReport> {
  return invoke<WeeklyReport>("get_weekly_entries", { startDate });
}

export async function syncWorklog(
  timeEntryId: string,
  durationOverride?: number,
): Promise<void> {
  await invoke("sync_worklog", {
    timeEntryId,
    durationOverride: durationOverride ?? null,
  });
}

export async function getPendingSyncs(): Promise<PendingSync[]> {
  return invoke<PendingSync[]>("get_pending_syncs");
}

export async function testJiraConnection(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("test_jira_connection");
}

export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>("get_setting", { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  await invoke("set_setting", { key, value });
}

export async function clearAllData(): Promise<void> {
  await invoke("clear_all_data");
}
