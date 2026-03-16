use chrono::{DateTime, Utc};
use serde::Serialize;
use std::collections::HashMap;
use tokio::sync::Mutex;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TimerState {
    Idle,
    Running,
    Paused,
}

#[derive(Debug, Clone, Serialize)]
pub struct TimerStatus {
    pub state: TimerState,
    pub task_id: Option<String>,
    pub elapsed_secs: i64,
}

#[derive(Debug)]
struct TaskTimer {
    started_at: DateTime<Utc>,
    accumulated_secs: i64,
    last_resumed_at: Option<DateTime<Utc>>,
}

impl TaskTimer {
    fn new() -> Self {
        let now = Utc::now();
        Self {
            started_at: now,
            accumulated_secs: 0,
            last_resumed_at: Some(now),
        }
    }

    fn elapsed_secs(&self, running: bool) -> i64 {
        if running {
            let extra = self
                .last_resumed_at
                .map(|t| (Utc::now() - t).num_seconds())
                .unwrap_or(0);
            self.accumulated_secs + extra
        } else {
            self.accumulated_secs
        }
    }

    fn pause(&mut self) {
        let extra = self
            .last_resumed_at
            .take()
            .map(|t| (Utc::now() - t).num_seconds())
            .unwrap_or(0);
        self.accumulated_secs += extra;
    }

    fn resume(&mut self) {
        self.last_resumed_at = Some(Utc::now());
    }

    fn finalize(&mut self) -> (DateTime<Utc>, i64) {
        self.pause();
        (self.started_at, self.accumulated_secs)
    }
}

/// Manages multiple task timers. Only one can be Running at a time.
#[derive(Debug)]
pub struct TimerManager {
    timers: HashMap<String, TaskTimer>,
    active_task_id: Option<String>,
}

impl TimerManager {
    pub fn new() -> Self {
        Self {
            timers: HashMap::new(),
            active_task_id: None,
        }
    }

    /// Starts timer for a task. If another task is running, it gets paused (not stopped).
    /// If this task was already paused, it gets resumed.
    pub fn start(&mut self, task_id: String) -> Result<(), String> {
        // Pause the currently active task (if any and different)
        if let Some(ref active) = self.active_task_id {
            if *active == task_id {
                // Already running this task — no-op
                if self.timers.contains_key(&task_id) {
                    return Ok(());
                }
            } else {
                // Pause the other task
                if let Some(timer) = self.timers.get_mut(active) {
                    timer.pause();
                }
            }
        }

        // Resume existing paused timer or create a new one
        if let Some(timer) = self.timers.get_mut(&task_id) {
            timer.resume();
        } else {
            self.timers.insert(task_id.clone(), TaskTimer::new());
        }

        self.active_task_id = Some(task_id);
        Ok(())
    }

    pub fn pause(&mut self) -> Result<(), String> {
        let active = self
            .active_task_id
            .as_ref()
            .ok_or("No timer is active")?;
        let timer = self
            .timers
            .get_mut(active)
            .ok_or("Active timer not found")?;
        timer.pause();
        self.active_task_id = None;
        Ok(())
    }

    pub fn resume(&mut self, task_id: Option<String>) -> Result<(), String> {
        // If a specific task_id is given, resume that one. Otherwise resume the last paused.
        let target = task_id
            .or_else(|| {
                // Find most recently used paused timer
                self.timers.keys().next().cloned()
            })
            .ok_or("No paused timer to resume")?;

        if self.active_task_id.as_ref() == Some(&target) {
            return Ok(()); // Already running
        }

        // Pause current active if any
        if let Some(ref active) = self.active_task_id {
            if let Some(timer) = self.timers.get_mut(active) {
                timer.pause();
            }
        }

        let timer = self
            .timers
            .get_mut(&target)
            .ok_or("Timer not found for this task")?;
        timer.resume();
        self.active_task_id = Some(target);
        Ok(())
    }

    /// Stops the active timer (or a specific task). Returns (task_id, started_at, duration_secs).
    pub fn stop(&mut self, task_id: Option<String>) -> Result<(String, DateTime<Utc>, i64), String> {
        let target = task_id
            .or_else(|| self.active_task_id.clone())
            .ok_or("No timer is active")?;

        let mut timer = self
            .timers
            .remove(&target)
            .ok_or("Timer not found for this task")?;

        let (started_at, duration) = timer.finalize();

        if self.active_task_id.as_ref() == Some(&target) {
            self.active_task_id = None;
        }

        Ok((target, started_at, duration))
    }

    pub fn status(&self) -> TimerStatus {
        match &self.active_task_id {
            Some(task_id) => {
                let elapsed = self
                    .timers
                    .get(task_id)
                    .map(|t| t.elapsed_secs(true))
                    .unwrap_or(0);
                TimerStatus {
                    state: TimerState::Running,
                    task_id: Some(task_id.clone()),
                    elapsed_secs: elapsed,
                }
            }
            None => {
                // Check if there are paused timers
                if self.timers.is_empty() {
                    TimerStatus {
                        state: TimerState::Idle,
                        task_id: None,
                        elapsed_secs: 0,
                    }
                } else {
                    // Return info about first paused timer
                    let (task_id, timer) = self.timers.iter().next().unwrap();
                    TimerStatus {
                        state: TimerState::Paused,
                        task_id: Some(task_id.clone()),
                        elapsed_secs: timer.elapsed_secs(false),
                    }
                }
            }
        }
    }

    /// Returns status for a specific task (for the frontend to show per-task elapsed time).
    pub fn task_elapsed(&self, task_id: &str) -> Option<(TimerState, i64)> {
        let is_active = self.active_task_id.as_deref() == Some(task_id);
        self.timers.get(task_id).map(|t| {
            let state = if is_active {
                TimerState::Running
            } else {
                TimerState::Paused
            };
            (state, t.elapsed_secs(is_active))
        })
    }

    /// Stops all timers. Returns vec of (task_id, started_at, duration_secs).
    pub fn stop_all(&mut self) -> Vec<(String, DateTime<Utc>, i64)> {
        self.active_task_id = None;
        self.timers
            .drain()
            .map(|(task_id, mut timer)| {
                let (started_at, duration) = timer.finalize();
                (task_id, started_at, duration)
            })
            .collect()
    }

    /// List all tracked task IDs (active + paused).
    pub fn tracked_tasks(&self) -> Vec<(String, TimerState, i64)> {
        self.timers
            .iter()
            .map(|(task_id, timer)| {
                let is_active = self.active_task_id.as_deref() == Some(task_id.as_str());
                let state = if is_active {
                    TimerState::Running
                } else {
                    TimerState::Paused
                };
                (task_id.clone(), state, timer.elapsed_secs(is_active))
            })
            .collect()
    }
}

pub type Timer = Mutex<TimerManager>;

pub fn create_timer() -> Timer {
    Mutex::new(TimerManager::new())
}
