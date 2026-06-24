"use client";

import { Member } from "@/lib/types";
import { Avatar, Icon } from "./parts";

export type NavItem = {
  id: string;
  label: string;
  icon: "grid" | "bulb" | "users" | "settings";
};

export function Sidebar({
  studioName,
  items,
  active,
  onNavigate,
  currentUser,
  isDark,
  onToggleTheme,
  onSwitchUser,
}: {
  studioName: string;
  items: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  currentUser?: Member;
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchUser: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-ink">
          <Icon name="check" size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">
            {studioName}
          </p>
          <p className="truncate text-xs text-muted-foreground">Team workspace</p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={[
                "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-bg text-slate-ink"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-ink",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--color-slate-ink)]" />
              )}
              <Icon name={item.icon} size={19} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* footer: user + theme */}
      <div className="space-y-2 border-t border-line p-3">
        {currentUser && (
          <button
            onClick={onSwitchUser}
            title="Switch user"
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
          >
            <Avatar member={currentUser} size={30} />
            <span className="text-sm font-medium capitalize text-ink">
              {currentUser.name}
            </span>
          </button>
        )}
        <button
          onClick={onToggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Icon name={isDark ? "sun" : "moon"} size={19} />
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </div>
  );
}
