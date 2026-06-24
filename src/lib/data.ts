import { Idea, Member, Project, Task } from "./types";

/**
 * Stage 1 uses in-memory sample data so the design can be reviewed.
 * In Stage 2 this is replaced by Supabase (members/projects/tasks tables).
 */

export const MEMBERS: Member[] = [
  { id: "m_gelika", name: "gelika", initial: "G", color: "#e08a63", ink: "#3a1c0e" },
  { id: "m_cotne", name: "cotne", initial: "C", color: "#6f9bc4", ink: "#0f2740" },
  { id: "m_nitch", name: "nitch", initial: "N", color: "#7ba86a", ink: "#1b3311" },
  { id: "m_abdu", name: "abdu", initial: "A", color: "#9d8fd6", ink: "#241a52" },
  { id: "m_leqso", name: "leqso", initial: "L", color: "#d58ba6", ink: "#451527" },
];

export const PROJECTS: Project[] = [
  { id: "p_alpha", name: "Project Alpha" },
  { id: "p_side", name: "Side hustle" },
];

export const SAMPLE_TASKS: Task[] = [
  {
    id: "t1",
    projectId: "p_alpha",
    title: "Launch TikTok ad set",
    description: "3 creatives, $50/day test budget.",
    status: "todo",
    priority: "urgent",
    assigneeIds: ["m_gelika"],
    dueDate: "2026-06-26",
    createdAt: "2026-06-22T09:00:00Z",
  },
  {
    id: "t2",
    projectId: "p_alpha",
    title: "Register the company",
    description: "Talk to the bank contact about paperwork.",
    status: "todo",
    priority: "medium",
    assigneeIds: ["m_leqso"],
    createdAt: "2026-06-22T10:00:00Z",
  },
  {
    id: "t3",
    projectId: "p_alpha",
    title: "Write welcome email",
    description: "First message new signups get.",
    status: "todo",
    priority: "low",
    assigneeIds: [],
    dueDate: "2026-06-21",
    createdAt: "2026-06-20T10:00:00Z",
  },
  {
    id: "t4",
    projectId: "p_alpha",
    title: "Build landing page",
    description: "Hero section + waitlist form.",
    status: "doing",
    priority: "urgent",
    assigneeIds: ["m_cotne", "m_abdu"],
    dueDate: "2026-06-30",
    createdAt: "2026-06-21T11:00:00Z",
  },
  {
    id: "t5",
    projectId: "p_alpha",
    title: "Find office furniture",
    description: "5 desks + chairs for the new floor.",
    status: "doing",
    priority: "low",
    assigneeIds: ["m_nitch"],
    dueDate: "2026-07-01",
    createdAt: "2026-06-21T12:00:00Z",
  },
  {
    id: "t6",
    projectId: "p_alpha",
    title: "Pick a brand name",
    status: "done",
    priority: "medium",
    assigneeIds: ["m_abdu"],
    createdAt: "2026-06-19T09:00:00Z",
  },
  {
    id: "t7",
    projectId: "p_alpha",
    title: "Set up Telegram group",
    status: "done",
    priority: "low",
    assigneeIds: ["m_gelika"],
    createdAt: "2026-06-18T09:00:00Z",
  },
  {
    id: "t8",
    projectId: "p_side",
    title: "Validate the idea with 10 people",
    description: "Quick calls, write down objections.",
    status: "todo",
    priority: "medium",
    assigneeIds: [],
    createdAt: "2026-06-23T09:00:00Z",
  },
  {
    id: "t9",
    projectId: "p_side",
    title: "Sketch the logo",
    status: "doing",
    priority: "low",
    assigneeIds: ["m_leqso"],
    dueDate: "2026-06-28",
    createdAt: "2026-06-23T10:00:00Z",
  },
];

export const SAMPLE_IDEAS: Idea[] = [
  {
    id: "i1",
    title: "AI receipt scanner for small shops",
    pitch: "Snap a photo, get bookkeeping done. Charge monthly.",
    suggestedById: "m_abdu",
    status: "exploring",
    votes: ["m_abdu", "m_cotne", "m_nitch"],
    createdAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "i2",
    title: "Dropshipping store for gym gear",
    pitch: "Ride the fitness trend, test with TikTok ads first.",
    suggestedById: "m_gelika",
    status: "building",
    votes: ["m_gelika", "m_leqso"],
    createdAt: "2026-06-19T09:00:00Z",
  },
  {
    id: "i3",
    title: "Local food delivery in Batumi",
    pitch: "Underserved market, build relationships with restaurants.",
    suggestedById: "m_leqso",
    status: "new",
    votes: ["m_leqso"],
    createdAt: "2026-06-22T09:00:00Z",
  },
  {
    id: "i4",
    title: "Newsletter sponsorship marketplace",
    pitch: "Connect small newsletters with advertisers.",
    suggestedById: "m_cotne",
    status: "parked",
    votes: [],
    createdAt: "2026-06-15T09:00:00Z",
  },
];

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === "done") return false;
  return dueDate < todayISO();
}

/** "Jun 26" style short label. */
export function formatDue(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}`;
}
