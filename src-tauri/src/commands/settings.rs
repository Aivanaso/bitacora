use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn get_setting(
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    let result = db.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        rusqlite::params![key],
        |row| row.get(0),
    );

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get setting: {e}")),
    }
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;

    db.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    )
    .map_err(|e| format!("Failed to set setting: {e}"))?;

    Ok(())
}

#[tauri::command]
pub async fn clear_all_data(state: State<'_, AppState>) -> Result<(), String> {
    // Stop all timers first
    {
        let mut timer = state.timer.lock().await;
        timer.stop_all();
    }

    let db = state.db.lock().map_err(|e| format!("DB lock error: {e}"))?;
    db.execute_batch(
        "DELETE FROM jira_syncs;
         DELETE FROM time_entries;
         DELETE FROM tasks;",
    )
    .map_err(|e| format!("Failed to clear data: {e}"))?;

    Ok(())
}
