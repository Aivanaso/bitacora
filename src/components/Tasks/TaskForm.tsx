import { useState } from "react";

interface TaskFormProps {
  onSubmit: (title: string, jiraTicket?: string) => void;
  onCancel: () => void;
  initialTitle?: string;
  initialTicket?: string;
}

export function TaskForm({
  onSubmit,
  onCancel,
  initialTitle = "",
  initialTicket = "",
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [jiraTicket, setJiraTicket] = useState(initialTicket);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, jiraTicket.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-zinc-800 p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {initialTitle ? "Edit Task" : "New Task"}
        </h2>

        <div className="mb-4">
          <label
            htmlFor="task-title"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            Title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            required
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="jira-ticket"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            Jira Ticket (optional)
          </label>
          <input
            id="jira-ticket"
            type="text"
            value={jiraTicket}
            onChange={(e) => setJiraTicket(e.target.value)}
            placeholder="e.g. PROJ-123"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            {initialTitle ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
