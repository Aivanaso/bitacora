import { useState } from "react";
import type { Task, TrackedTask } from "../../types";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";

interface TaskListProps {
  tasks: Task[];
  trackedTasks: TrackedTask[];
  onStart: (taskId: string) => void;
  onStop: (taskId: string) => void;
  onCreateTask: (title: string, jiraTicket?: string) => void;
  onArchiveTask: (id: string) => void;
}

export function TaskList({
  tasks,
  trackedTasks,
  onStart,
  onStop,
  onCreateTask,
  onArchiveTask,
}: TaskListProps) {
  const [showForm, setShowForm] = useState(false);

  function handleCreate(title: string, jiraTicket?: string) {
    onCreateTask(title, jiraTicket);
    setShowForm(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          + New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No tasks yet. Create one to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              tracked={trackedTasks.find((t) => t.task_id === task.id)}
              onStart={onStart}
              onStop={onStop}
              onArchive={onArchiveTask}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
