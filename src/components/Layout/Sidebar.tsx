interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "timer", label: "Timer", icon: "\u23F1" },
  { id: "tasks", label: "Tasks", icon: "\u2611" },
  { id: "reports", label: "Reports", icon: "\uD83D\uDCCA" },
  { id: "jira", label: "Jira", icon: "\uD83D\uDD17" },
  { id: "settings", label: "Settings", icon: "\u2699" },
] as const;

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-screen w-52 flex-col bg-zinc-800">
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-6">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-zinc-700 p-4">
        <p className="text-center text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Bitacora
        </p>
      </div>
    </aside>
  );
}
