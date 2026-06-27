"use client";

import { motion } from "framer-motion";
import { Member, Priority } from "@/lib/types";
import { formatDue, isOverdue } from "@/lib/data";

/* ---------------- Icons (inline, no dependency) ---------------- */

type IconName =
  | "plus"
  | "check"
  | "x"
  | "sun"
  | "moon"
  | "calendar"
  | "grip"
  | "user"
  | "trash"
  | "grid"
  | "bulb"
  | "users"
  | "settings"
  | "menu"
  | "arrowRight"
  | "fire"
  | "dots"
  | "send"
  | "image"
  | "refresh"
  | "comment"
  | "bell";

const PATHS: Record<IconName, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12l5 5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0012 3z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0112 0" />
      <path d="M16 5a3.5 3.5 0 010 6.5M21 20a6 6 0 00-4-5.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  fire: (
    <path d="M12 3c1 3-2 4-2 7a2 2 0 004 0c0-1 1-2 1-2 1 1.5 2 3 2 5a5 5 0 01-10 0c0-4 4-5 5-10z" />
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 11-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  comment: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.5 21a1.8 1.8 0 01-3 0" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------------- Avatars ---------------- */

export function Avatar({
  member,
  size = 28,
  ring = "var(--surface)",
}: {
  member: Member;
  size?: number;
  ring?: string;
}) {
  return (
    <span
      title={member.name}
      style={{
        width: size,
        height: size,
        background: member.color,
        color: member.ink,
        boxShadow: `0 0 0 2px ${ring}`,
        fontSize: size * 0.42,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {member.initial}
    </span>
  );
}

export function AvatarStack({
  members,
  size = 24,
  ring = "var(--surface)",
}: {
  members: Member[];
  size?: number;
  ring?: string;
}) {
  if (members.length === 0) return null;
  return (
    <div className="flex items-center">
      {members.map((m, i) => (
        <span key={m.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar member={m} size={size} ring={ring} />
        </span>
      ))}
    </div>
  );
}

/* ---------------- Priority dot ---------------- */

const PRIO_COLOR: Record<Priority, string> = {
  low: "var(--color-prio-low)",
  medium: "var(--color-prio-medium)",
  urgent: "var(--color-prio-urgent)",
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      title={`${priority} priority`}
      style={{ background: PRIO_COLOR[priority] }}
      className="mt-1.5 inline-block size-2 shrink-0 rounded-full"
    />
  );
}

/* ---------------- Due-date pill ---------------- */

export function DuePill({
  dueDate,
  status,
}: {
  dueDate?: string;
  status: string;
}) {
  if (!dueDate) {
    return (
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        No date
      </span>
    );
  }
  const overdue = isOverdue(dueDate, status);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={
        overdue
          ? { background: "var(--color-danger-bg)", color: "var(--color-danger-ink)" }
          : { background: "var(--color-slate-bg)", color: "var(--color-slate-ink)" }
      }
    >
      <Icon name="calendar" size={12} />
      {formatDue(dueDate)}
      {overdue && " · overdue"}
    </span>
  );
}

/* ---------------- Confetti burst (on task → done) ---------------- */

const CONFETTI_COLORS = ["#0a0a0a", "#52525b", "#a1a1aa", "#16a34a", "#d4d4d8", "#16a34a"];

export function Confetti() {
  const pieces = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 60 + (i % 3) * 22;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist - 10,
              opacity: 0,
              scale: 0.4,
              rotate: i * 40,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            className="absolute size-2 rounded-[2px]"
          />
        );
      })}
    </div>
  );
}
