import { useState, useCallback } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { TimerDisplay } from "./components/Timer/TimerDisplay";
import { TimerControls } from "./components/Timer/TimerControls";
import { TaskList } from "./components/Tasks/TaskList";
import { DailyView } from "./components/Reports/DailyView";
import { WeeklyView } from "./components/Reports/WeeklyView";
import { JiraSync } from "./components/Jira/JiraSync";
import { SettingsForm } from "./components/Settings/SettingsForm";
import { useTimer } from "./hooks/useTimer";
import { useTasks } from "./hooks/useTasks";
import { useReports } from "./hooks/useReports";
import { useJiraSync } from "./hooks/useJiraSync";

type Page = "timer" | "tasks" | "reports" | "jira" | "settings";

function App() {
  const [page, setPage] = useState<Page>("timer");
  const [reportTab, setReportTab] = useState<"daily" | "weekly">("daily");

  const timer = useTimer();
  const tasks = useTasks();
  const reports = useReports();
  const jira = useJiraSync();

  const activeTask = tasks.tasks.find((t) => t.id === timer.status.task_id);

  const handleStop = useCallback(
    async (taskId?: string) => {
      await timer.stop(taskId);
      reports.refresh();
    },
    [timer, reports],
  );

  const handleStopAll = useCallback(async () => {
    await timer.stopAll();
    reports.refresh();
  }, [timer, reports]);

  const handleClearAll = useCallback(async () => {
    await import("./lib/tauri").then((t) => t.clearAllData());
    await timer.stopAll();
    tasks.refresh();
    reports.refresh();
  }, [timer, tasks, reports]);

  function renderPage() {
    switch (page) {
      case "timer":
        return (
          <div className="flex flex-col gap-6">
            <div className="rounded-lg bg-zinc-800 p-6">
              <TimerDisplay
                elapsedSecs={timer.status.elapsed_secs}
                state={timer.status.state}
                taskName={activeTask?.title ?? null}
              />
              <TimerControls
                state={timer.status.state}
                hasTrackedTasks={timer.trackedTasks.length > 0}
                onPause={timer.pause}
                onResume={() => timer.resume()}
                onStop={() => handleStop(timer.status.task_id ?? undefined)}
                onStopAll={handleStopAll}
              />
            </div>

            <TaskList
              tasks={tasks.tasks}
              trackedTasks={timer.trackedTasks}
              onStart={timer.start}
              onStop={handleStop}
              onCreateTask={tasks.createTask}
              onArchiveTask={tasks.archiveTask}
            />
          </div>
        );

      case "tasks":
        return (
          <TaskList
            tasks={tasks.tasks}
            trackedTasks={timer.trackedTasks}
            onStart={timer.start}
            onStop={handleStop}
            onCreateTask={tasks.createTask}
            onArchiveTask={tasks.archiveTask}
          />
        );

      case "reports":
        return (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setReportTab("daily")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  reportTab === "daily"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setReportTab("weekly")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  reportTab === "weekly"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                Weekly
              </button>
            </div>

            {reportTab === "daily" ? (
              <DailyView
                report={reports.dailyReport}
                selectedDate={reports.selectedDate}
                onDateChange={reports.setSelectedDate}
                onRefresh={reports.refresh}
                loading={reports.loading}
              />
            ) : (
              <WeeklyView
                report={reports.weeklyReport}
                selectedWeek={reports.selectedWeek}
                onWeekChange={reports.setSelectedWeek}
                onRefresh={reports.refresh}
                loading={reports.loading}
              />
            )}
          </div>
        );

      case "jira":
        return (
          <JiraSync
            pending={jira.pending}
            connectionOk={jira.connectionOk}
            onSync={jira.syncWorklog}
            onTestConnection={jira.testConnection}
            loading={jira.loading}
          />
        );

      case "settings":
        return <SettingsForm onClearAll={handleClearAll} />;
    }
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100">
      <Sidebar active={page} onNavigate={(p) => setPage(p as Page)} />
      <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
    </div>
  );
}

export default App;
