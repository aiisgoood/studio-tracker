"use client";

import { MEMBERS } from "@/lib/data";
import { Project } from "@/lib/types";
import { Avatar, Icon } from "./parts";

export function SettingsPage({
  studioName,
  setStudioName,
  isDark,
  toggleTheme,
  projects,
}: {
  studioName: string;
  setStudioName: (name: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  projects: Project[];
}) {
  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Make it yours.</p>
      </div>

      <div className="space-y-4">
        {/* Studio name */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Studio name
          </label>
          <input
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Shows in the sidebar and on Telegram messages (later stage).
          </p>
        </section>

        {/* Theme */}
        <section className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
          <div>
            <p className="text-sm font-medium text-ink">Theme</p>
            <p className="text-xs text-muted-foreground">
              {isDark ? "Warm charcoal (dark)" : "Linen (light)"}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            <Icon name={isDark ? "sun" : "moon"} size={16} />
            {isDark ? "Switch to light" : "Switch to dark"}
          </button>
        </section>

        {/* Members */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-ink">
            Members ({MEMBERS.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm capitalize text-ink"
              >
                <Avatar member={m} size={24} />
                {m.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Editing members & adding logins comes in a later stage.
          </p>
        </section>

        {/* Projects */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-ink">
            Projects ({projects.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink"
              >
                {p.name}
              </span>
            ))}
          </div>
        </section>

        <p className="px-1 text-xs text-muted-foreground">
          Telegram notifications & team passcode arrive in later stages.
        </p>
      </div>
    </div>
  );
}
