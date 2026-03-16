use chrono::Utc;
use serde::Serialize;
use tauri::State;
use uuid::Uuid;

use crate::timer::{TimerState, TimerStatus};
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct TrackedTask {
    pub task_id: String,
    pub state: TimerState,
    pub elapsed_secs: i64,
}

#[tauri::command]
pub async fn start_timer(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TimerStatus, String> {
    let mut timer = state.timer.lock().await;
    timer.start(task_id)?;
    Ok(timer.status())
}

#[tauri::command]
pub async fn pause_timer(state: State<'_, AppState>) -> Result<TimerStatus, String> {
    let mut timer = state.timer.lock().await;
    timer.pause()?;
    Ok(timer.status())
}

#[tauri::command]
pub async fn resume_timer(
    task_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<TimerStatus, String> {
    let mut timer = state.timer.lock().await;
    timer.resume(task_id)?;
    Ok(timer.status())
}

#[tauri::command]
pub async fn stop_timer(
    task_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<TimerStatus, String> {
    let (stopped_task_id, started_at, duration) = {
        let mut timer = state.timer.lock().await;
        timer.stop(task_id)?
    };
    persist_time_entry(&state, &stopped_task_id, started_at, duration)?;

    let timer = state.timer.lock().await;
    Ok(timer.status())
}

#[tauri::command]
pub async fn stop_all_timers(
    state: State<'_, AppState>,
) -> Result<TimerStatus, String> {
    let stopped = {
        let mut timer = state.timer.lock().await;
        timer.stop_all()
    };
    for (task_id, started_at, duration) in stopped {
        persist_time_entry(&state, &task_id, started_at, duration)?;
    }
    let timer = state.timer.lock().await;
    Ok(timer.status())
}

#[tauri::command]
pub async fn get_timer_status(state: State<'_, AppState>) -> Result<TimerStatus, String> {
    let timer = state.timer.lock().await;
    Ok(timer.status())
}

#[tauri::command]
pub async fn get_tracked_tasks(
    state: State<'_, AppState>,
) -> Result<Vec<TrackedTask>, String> {
    let timer = state.timer.lock().await;
    let tasks = timer
        .tracked_tasks()
        .into_iter()
        .map(|(task_id, timer_state, elapsed_secs)| TrackedTask {
            task_id,
            state: timer_state,
            elapsed_secs,
        })
        .collect();
    Ok(tasks)
}

fn persist_time_entry(
    state: &State<'_, AppState>,
    task_id: &str,
    started_at: chrono::DateTime<Utc>,
    duration_secs: i64,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
    let id = Uuid::new_v4().to_string();
    let started = started_at.format("%Y-%m-%dT%H:%M:%S").to_string();
    let ended = Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    db.execute(
        "INSERT INTO time_entries (id, task_id, started_at, ended_at, duration_secs) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![id, task_id, started, ended, duration_secs],
    )
    .map_err(|e| format!("Failed to persist time entry: {e}"))?;

    Ok(())
}
