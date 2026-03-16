use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

const MIGRATION_SQL: &str = include_str!("migrations/001_create_tables.sql");

pub type DbPool = Mutex<Connection>;

pub fn init_db(app_dir: &Path) -> Result<DbPool, String> {
    std::fs::create_dir_all(app_dir)
        .map_err(|e| format!("Failed to create app dir: {e}"))?;

    let db_path = app_dir.join("bitacora.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {e}"))?;

    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("Failed to set pragmas: {e}"))?;

    run_migrations(&conn)?;

    Ok(Mutex::new(conn))
}

fn run_migrations(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(MIGRATION_SQL)
        .map_err(|e| format!("Migration failed: {e}"))
}
