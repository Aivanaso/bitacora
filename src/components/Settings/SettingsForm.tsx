import { useState, useEffect } from "react";
import * as tauri from "../../lib/tauri";

interface SettingsFormProps {
  onClearAll: () => Promise<void>;
}

export function SettingsForm({ onClearAll }: SettingsFormProps) {
  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [url, email, token] = await Promise.all([
          tauri.getSetting("jira_url"),
          tauri.getSetting("jira_email"),
          tauri.getSetting("jira_token"),
        ]);
        setJiraUrl(url ?? "");
        setJiraEmail(email ?? "");
        setJiraToken(token ?? "");
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        tauri.setSetting("jira_url", jiraUrl.trim()),
        tauri.setSetting("jira_email", jiraEmail.trim()),
        tauri.setSetting("jira_token", jiraToken.trim()),
      ]);
      setMessage({ type: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: `Failed to save: ${String(err)}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const result = await tauri.testJiraConnection();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: `Connection error: ${String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleClearData() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    setClearMessage(null);
    try {
      await onClearAll();
      setClearMessage({ type: "success", text: "All data cleared." });
      setConfirmClear(false);
    } catch (err) {
      setClearMessage({
        type: "error",
        text: `Failed to clear data: ${String(err)}`,
      });
    } finally {
      setClearing(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Settings</h2>

      <form
        onSubmit={handleSave}
        className="max-w-lg rounded-lg border border-zinc-700 bg-zinc-800 p-6"
      >
        <div className="mb-4">
          <label
            htmlFor="jira-url"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            Jira URL
          </label>
          <input
            id="jira-url"
            type="url"
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            placeholder="https://your-org.atlassian.net"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="jira-email"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            Email
          </label>
          <input
            id="jira-email"
            type="email"
            value={jiraEmail}
            onChange={(e) => setJiraEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="jira-token"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            API Token
          </label>
          <input
            id="jira-token"
            type="password"
            value={jiraToken}
            onChange={(e) => setJiraToken(e.target.value)}
            placeholder="Your Jira API token"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </form>

      <div className="mt-8 max-w-lg rounded-lg border border-red-500/30 bg-zinc-800 p-6">
        <h3 className="mb-2 text-sm font-semibold text-red-400">
          Danger Zone
        </h3>
        <p className="mb-4 text-sm text-zinc-400">
          Delete all tasks, time entries and sync history. Settings are
          preserved.
        </p>

        {clearMessage && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              clearMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {clearMessage.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearData}
            disabled={clearing}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              confirmClear
                ? "bg-red-500 text-white hover:bg-red-600"
                : "border border-red-500/40 text-red-400 hover:bg-red-500/10"
            }`}
          >
            {clearing
              ? "Clearing..."
              : confirmClear
                ? "Click again to confirm"
                : "Clear All Data"}
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
