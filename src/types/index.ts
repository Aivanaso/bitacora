export interface Task {
  id: string;
  title: string;
  jira_ticket: string | null;
  created_at: string;
  archived: boolean;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_secs: number | null;
}

export type TimerState = "idle" | "running" | "paused";

export interface TimerStatus {
  state: TimerState;
  task_id: string | null;
  elapsed_secs: number;
}

export interface DailyReport {
  entries: Array<TimeEntry & { task_title: string; jira_ticket: string | null }>;
  total_secs: number;
}

export interface WeeklyReport {
  tasks: Array<{
    task_id: string;
    task_title: string;
    jira_ticket: string | null;
    total_secs: number;
    entries: TimeEntry[];
  }>;
  total_secs: number;
}

export interface PendingSync {
  time_entry_id: string;
  task_title: string;
  jira_ticket: string;
  duration_secs: number;
  started_at: string;
  synced: boolean;
}

export interface TrackedTask {
  task_id: string;
  state: TimerState;
  elapsed_secs: number;
}

export interface Settings {
  jira_url: string;
  jira_email: string;
  jira_token: string;
}
