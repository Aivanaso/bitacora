CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    jira_ticket TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    archived BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    duration_secs INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS jira_syncs (
    id TEXT PRIMARY KEY NOT NULL,
    time_entry_id TEXT NOT NULL,
    worklog_id TEXT NOT NULL,
    synced_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
