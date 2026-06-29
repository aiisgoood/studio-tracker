"use client";

import { useEffect, useRef, useState } from "react";
import { Notif } from "@/lib/notifications";
import { memberById } from "@/lib/data";
import { Avatar, Icon } from "./parts";

/** The middle phrase shown between the actor's name and the target title. */
function notifPhrase(n: Notif): string {
  switch (n.kind) {
    case "mention":
      return "mentioned you in";
    case "comment":
      return `commented on your ${n.targetType}`;
    case "assigned":
      return "commented on a task you're on";
    case "reply":
      return `replied in ${n.targetType === "task" ? "a task" : "an idea"} you're in`;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationsBell({
  notifications,
  seenAt,
  onSeen,
  onSelect,
}: {
  notifications: Notif[];
  /** ISO timestamp the user last opened the bell */
  seenAt: string;
  /** mark everything seen (called when the panel closes) */
  onSeen: () => void;
  onSelect: (n: Notif) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => n.createdAt > seenAt).length;

  function close() {
    if (open) {
      setOpen(false);
      onSeen();
    }
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative rounded-lg p-1.5 text-ink transition-colors hover:bg-secondary"
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-prio-urgent)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[26rem] w-80 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Notifications
          </p>
          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nothing yet. Comments and mentions on your tasks show up here.
            </p>
          ) : (
            notifications.map((n) => {
              const actor = memberById(n.actorId);
              const isUnread = n.createdAt > seenAt;
              return (
                <button
                  key={`${n.kind}-${n.id}`}
                  onClick={() => {
                    onSelect(n);
                    close();
                  }}
                  className={[
                    "flex w-full gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-secondary",
                    isUnread ? "bg-secondary/60" : "",
                  ].join(" ")}
                >
                  {actor ? (
                    <Avatar member={actor} size={28} ring="var(--surface)" />
                  ) : (
                    <span className="size-7 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-ink">
                      <span className="font-semibold capitalize">
                        {actor?.name ?? "Someone"}
                      </span>{" "}
                      {notifPhrase(n)}{" "}
                      <span className="font-medium">“{n.targetTitle}”</span>
                    </p>
                    {n.snippet && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {n.snippet}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
