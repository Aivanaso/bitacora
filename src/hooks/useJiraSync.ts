import { useState, useEffect, useCallback } from "react";
import type { PendingSync } from "../types";
import * as tauri from "../lib/tauri";

export function useJiraSync() {
  const [pending, setPending] = useState<PendingSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await tauri.getPendingSyncs();
      setPending(list);
    } catch (err) {
      console.error("Failed to fetch pending syncs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const syncWorklog = useCallback(
    async (timeEntryId: string, durationOverride?: number) => {
      await tauri.syncWorklog(timeEntryId, durationOverride);
      await refresh();
    },
    [refresh],
  );

  const testConnection = useCallback(async () => {
    try {
      const result = await tauri.testJiraConnection();
      setConnectionOk(result.success);
      return result.success;
    } catch {
      setConnectionOk(false);
      return false;
    }
  }, []);

  return { pending, loading, connectionOk, syncWorklog, testConnection, refresh };
}
