use chrono::Utc;
use serde::Serialize;
use tauri::State;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Serialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub jira_ticket: Option<String>,
    pub created_at: String,
    pub archived: bool,
}

#[tauri::command]
pub async fn create_task(
    title: String,
    jira_ticket: Option<String>,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    db.execute(
        "INSERT INTO tasks (id, title, jira_ticket, created_at, archived) VALUES (?1, ?2, ?3, ?4, 0)",
        rusqlite::params![id, title, jira_ticket, created_at],
    )
    .map_err(|e| format!("Failed to create task: {e}"))?;

    Ok(Task {
        id,
        title,
        jira_ticket,
        created_at,
        archived: false,
    })
}

#[tauri::command]
pub async fn list_tasks(
    include_archived: Option<bool>,
    state: State<'_, AppState>,
) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
    let include = include_archived.unwrap_or(false);

    let query = if include {
        "SELECT id, title, jira_ticket, created_at, archived FROM tasks ORDER BY created_at DESC"
    } else {
        "SELECT id, title, jira_ticket, created_at, archived FROM tasks WHERE archived = 0 ORDER BY created_at DESC"
    };

    let mut stmt = db.prepare(query).map_err(|e| format!("Query error: {e}"))?;

    let tasks = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                jira_ticket: row.get(2)?,
                created_at: row.get(3)?,
                archived: row.get(4)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row mapping error: {e}"))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn update_task(
    id: String,
    title: Option<String>,
    jira_ticket: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    if let Some(t) = &title {
        db.execute(
            "UPDATE tasks SET title = ?1 WHERE id = ?2",
            rusqlite::params![t, id],
        )
        .map_err(|e| format!("Failed to update title: {e}"))?;
    }

    if let Some(jt) = &jira_ticket {
        db.execute(
            "UPDATE tasks SET jira_ticket = ?1 WHERE id = ?2",
            rusqlite::params![jt, id],
        )
        .map_err(|e| format!("Failed to update jira_ticket: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn archive_task(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    let rows = db
        .execute(
            "UPDATE tasks SET archived = 1 WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| format!("Failed to archive task: {e}"))?;

    if rows == 0 {
        return Err("Task not found".into());
    }

    Ok(())
}
