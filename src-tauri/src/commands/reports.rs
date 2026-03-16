use serde::Serialize;
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize)]
pub struct TimeEntry {
    pub id: String,
    pub task_id: String,
    pub task_title: String,
    pub jira_ticket: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_secs: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct DailyReport {
    pub date: String,
    pub entries: Vec<TimeEntry>,
    pub total_secs: i64,
}

#[derive(Debug, Serialize)]
pub struct TaskGroup {
    pub task_id: String,
    pub task_title: String,
    pub jira_ticket: Option<String>,
    pub entries: Vec<TimeEntry>,
    pub total_secs: i64,
}

#[derive(Debug, Serialize)]
pub struct WeeklyReport {
    pub start_date: String,
    pub tasks: Vec<TaskGroup>,
    pub total_secs: i64,
}

#[tauri::command]
pub async fn get_daily_entries(
    date: String,
    state: State<'_, AppState>,
) -> Result<DailyReport, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    let mut stmt = db
        .prepare(
            "SELECT te.id, te.task_id, t.title, t.jira_ticket, te.started_at, te.ended_at, te.duration_secs
             FROM time_entries te
             JOIN tasks t ON t.id = te.task_id
             WHERE date(te.started_at) = date(?1)
             ORDER BY te.started_at ASC",
        )
        .map_err(|e| format!("Query error: {e}"))?;

    let entries: Vec<TimeEntry> = stmt
        .query_map(rusqlite::params![date], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task_id: row.get(1)?,
                task_title: row.get(2)?,
                jira_ticket: row.get(3)?,
                started_at: row.get(4)?,
                ended_at: row.get(5)?,
                duration_secs: row.get(6)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row mapping error: {e}"))?;

    let total_secs: i64 = entries.iter().filter_map(|e| e.duration_secs).sum();

    Ok(DailyReport {
        date,
        entries,
        total_secs,
    })
}

#[tauri::command]
pub async fn get_weekly_entries(
    start_date: String,
    state: State<'_, AppState>,
) -> Result<WeeklyReport, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    let mut stmt = db
        .prepare(
            "SELECT te.id, te.task_id, t.title, t.jira_ticket, te.started_at, te.ended_at, te.duration_secs
             FROM time_entries te
             JOIN tasks t ON t.id = te.task_id
             WHERE date(te.started_at) >= date(?1)
               AND date(te.started_at) < date(?1, '+7 days')
             ORDER BY te.task_id, te.started_at ASC",
        )
        .map_err(|e| format!("Query error: {e}"))?;

    let entries: Vec<TimeEntry> = stmt
        .query_map(rusqlite::params![start_date], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task_id: row.get(1)?,
                task_title: row.get(2)?,
                jira_ticket: row.get(3)?,
                started_at: row.get(4)?,
                ended_at: row.get(5)?,
                duration_secs: row.get(6)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row mapping error: {e}"))?;

    let mut groups: Vec<TaskGroup> = Vec::new();
    for entry in entries {
        let existing = groups.iter_mut().find(|g| g.task_id == entry.task_id);
        match existing {
            Some(group) => {
                group.total_secs += entry.duration_secs.unwrap_or(0);
                group.entries.push(entry);
            }
            None => {
                let total = entry.duration_secs.unwrap_or(0);
                groups.push(TaskGroup {
                    task_id: entry.task_id.clone(),
                    task_title: entry.task_title.clone(),
                    jira_ticket: entry.jira_ticket.clone(),
                    entries: vec![entry],
                    total_secs: total,
                });
            }
        }
    }

    let total_secs: i64 = groups.iter().map(|g| g.total_secs).sum();

    Ok(WeeklyReport {
        start_date,
        tasks: groups,
        total_secs,
    })
}
