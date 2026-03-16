use serde::Serialize;
use tauri::State;
use uuid::Uuid;

use crate::jira::client::JiraClient;
use crate::jira::models::{JiraConnectionTest, JiraWorklogRequest};
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct PendingSync {
    pub time_entry_id: String,
    pub task_title: String,
    pub jira_ticket: String,
    pub started_at: String,
    pub duration_secs: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct SyncResult {
    pub worklog_id: String,
    pub synced: bool,
}

fn get_setting(db: &rusqlite::Connection, key: &str) -> Result<String, String> {
    db.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        rusqlite::params![key],
        |row| row.get(0),
    )
    .map_err(|_| format!("Setting '{key}' not found. Configure Jira settings first."))
}

fn build_jira_client(db: &rusqlite::Connection) -> Result<JiraClient, String> {
    let base_url = get_setting(db, "jira_base_url")?;
    let email = get_setting(db, "jira_email")?;
    let token = get_setting(db, "jira_api_token")?;
    Ok(JiraClient::new(&base_url, &email, &token))
}

#[tauri::command]
pub async fn sync_worklog(
    time_entry_id: String,
    duration_override: Option<i64>,
    state: State<'_, AppState>,
) -> Result<SyncResult, String> {
    let (client, jira_ticket, duration, started_at) = {
        let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
        let client = build_jira_client(&db)?;

        let (task_id, started_at, dur): (String, String, Option<i64>) = db
            .query_row(
                "SELECT task_id, started_at, duration_secs FROM time_entries WHERE id = ?1",
                rusqlite::params![time_entry_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .map_err(|e| format!("Time entry not found: {e}"))?;

        let jira_ticket: String = db
            .query_row(
                "SELECT jira_ticket FROM tasks WHERE id = ?1 AND jira_ticket IS NOT NULL",
                rusqlite::params![task_id],
                |row| row.get(0),
            )
            .map_err(|_| "Task has no Jira ticket assigned".to_string())?;

        let duration = duration_override.or(dur).ok_or("No duration available")?;
        (client, jira_ticket, duration, started_at)
    };

    let request = JiraWorklogRequest::new(duration, Some(started_at), None);
    let response = client.add_worklog(&jira_ticket, &request).await?;

    {
        let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
        let sync_id = Uuid::new_v4().to_string();
        db.execute(
            "INSERT INTO jira_syncs (id, time_entry_id, worklog_id) VALUES (?1, ?2, ?3)",
            rusqlite::params![sync_id, time_entry_id, response.id],
        )
        .map_err(|e| format!("Failed to record sync: {e}"))?;
    }

    Ok(SyncResult {
        worklog_id: response.id,
        synced: true,
    })
}

#[tauri::command]
pub async fn get_pending_syncs(
    state: State<'_, AppState>,
) -> Result<Vec<PendingSync>, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    let mut stmt = db
        .prepare(
            "SELECT te.id, t.title, t.jira_ticket, te.started_at, te.duration_secs
             FROM time_entries te
             JOIN tasks t ON t.id = te.task_id
             WHERE t.jira_ticket IS NOT NULL
               AND te.ended_at IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM jira_syncs js WHERE js.time_entry_id = te.id
               )
             ORDER BY te.started_at DESC",
        )
        .map_err(|e| format!("Query error: {e}"))?;

    let syncs = stmt
        .query_map([], |row| {
            Ok(PendingSync {
                time_entry_id: row.get(0)?,
                task_title: row.get(1)?,
                jira_ticket: row.get(2)?,
                started_at: row.get(3)?,
                duration_secs: row.get(4)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row mapping error: {e}"))?;

    Ok(syncs)
}

#[tauri::command]
pub async fn test_jira_connection(
    state: State<'_, AppState>,
) -> Result<JiraConnectionTest, String> {
    let client = {
        let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
        build_jira_client(&db)?
    };

    Ok(client.test_connection().await)
}
