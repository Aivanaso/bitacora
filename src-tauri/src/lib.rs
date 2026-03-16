mod commands;
mod db;
mod jira;
mod timer;

use db::DbPool;
use tauri::{Emitter, Manager};
use timer::Timer;

pub struct AppState {
    pub timer: Timer,
    pub db: DbPool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            let db_pool = db::init_db(&app_dir)
                .expect("Failed to initialize database");

            let state = AppState {
                timer: timer::create_timer(),
                db: db_pool,
            };
            app.manage(state);

            setup_tray(app)?;
            setup_shortcuts(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::timer::start_timer,
            commands::timer::pause_timer,
            commands::timer::resume_timer,
            commands::timer::stop_timer,
            commands::timer::get_timer_status,
            commands::timer::get_tracked_tasks,
            commands::timer::stop_all_timers,
            commands::tasks::create_task,
            commands::tasks::list_tasks,
            commands::tasks::update_task,
            commands::tasks::archive_task,
            commands::reports::get_daily_entries,
            commands::reports::get_weekly_entries,
            commands::jira::sync_worklog,
            commands::jira::get_pending_syncs,
            commands::jira::test_jira_connection,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::clear_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder};
    use tauri::tray::TrayIconBuilder;

    let current_task = MenuItemBuilder::with_id("current_task", "No task running")
        .enabled(false)
        .build(app)?;
    let pause_resume = MenuItemBuilder::with_id("pause_resume", "Pause / Resume").build(app)?;
    let open_window = MenuItemBuilder::with_id("open_window", "Open Bitacora").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&current_task)
        .separator()
        .item(&pause_resume)
        .item(&open_window)
        .separator()
        .item(&quit)
        .build()?;

    TrayIconBuilder::new()
        .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")).expect("Failed to load tray icon"))
        .menu(&menu)
        .tooltip("Bitácora")
        .on_menu_event(move |app, event| {
            let id = event.id().as_ref();
            match id {
                "pause_resume" => {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app.try_state::<AppState>() {
                            let mut timer = state.timer.lock().await;
                            let status = timer.status();
                            match status.state {
                                timer::TimerState::Running => {
                                    let _ = timer.pause();
                                }
                                timer::TimerState::Paused => {
                                    let _ = timer.resume(None);
                                }
                                timer::TimerState::Idle => {}
                            }
                        }
                    });
                }
                "open_window" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{
        Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
    };

    let pause_resume = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::SHIFT),
        Code::Space,
    );

    let app_handle = app.handle().clone();
    app.global_shortcut().on_shortcut(pause_resume, move |_app, _shortcut, event| {
        if event.state() != ShortcutState::Pressed {
            return;
        }
        let handle = app_handle.clone();
        tauri::async_runtime::spawn(async move {
            if let Some(state) = handle.try_state::<AppState>() {
                let mut timer = state.timer.lock().await;
                let status = timer.status();
                match status.state {
                    timer::TimerState::Running => {
                        let _ = timer.pause();
                    }
                    timer::TimerState::Paused => {
                        let _ = timer.resume(None);
                    }
                    timer::TimerState::Idle => {}
                }
            }
        });
    })?;

    let new_task = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::SHIFT),
        Code::KeyN,
    );

    let app_handle2 = app.handle().clone();
    app.global_shortcut().on_shortcut(new_task, move |_app, _shortcut, event| {
        if event.state() != ShortcutState::Pressed {
            return;
        }
        let handle = app_handle2.clone();
        if let Some(window) = handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("new-task-shortcut", ());
        }
    })?;

    Ok(())
}
