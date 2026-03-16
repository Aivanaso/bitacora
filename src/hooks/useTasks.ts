import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types";
import * as tauri from "../lib/tauri";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await tauri.listTasks(false);
      setTasks(list);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (title: string, jiraTicket?: string) => {
      await tauri.createTask(title, jiraTicket);
      await refresh();
    },
    [refresh],
  );

  const updateTask = useCallback(
    async (id: string, title?: string, jiraTicket?: string) => {
      await tauri.updateTask(id, title, jiraTicket);
      await refresh();
    },
    [refresh],
  );

  const archiveTask = useCallback(
    async (id: string) => {
      await tauri.archiveTask(id);
      await refresh();
    },
    [refresh],
  );

  return { tasks, loading, createTask, updateTask, archiveTask, refresh };
}
