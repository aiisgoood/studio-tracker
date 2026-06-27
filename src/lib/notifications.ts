import { Comment, Idea, Member, Task } from "./types";

export interface Notif {
  /** the comment id this notification is about */
  id: string;
  kind: "comment" | "mention";
  /** member id of whoever commented */
  actorId: string;
  targetType: "task" | "idea";
  targetId: string;
  targetTitle: string;
  snippet?: string;
  createdAt: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the current user's in-app notifications from the comment feed:
 * - someone else commented on a task/idea the user created
 * - someone @mentioned the user in any comment
 * Newest first, capped at 50. Pure function of the data already in memory.
 */
export function deriveNotifications(opts: {
  comments: Comment[];
  tasks: Task[];
  ideas: Idea[];
  members: Member[];
  currentUserId: string | null;
}): Notif[] {
  const { comments, tasks, ideas, members, currentUserId } = opts;
  if (!currentUserId) return [];

  const myName = members.find((m) => m.id === currentUserId)?.name.toLowerCase();
  const mentionRe = myName
    ? new RegExp(`@${escapeRegex(myName)}\\b`, "i")
    : null;
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const ideaMap = new Map(ideas.map((i) => [i.id, i]));

  const out: Notif[] = [];
  for (const c of comments) {
    if (c.authorId === currentUserId) continue; // never notify on your own comment

    let targetType: "task" | "idea" | null = null;
    let targetId = "";
    let targetTitle = "";
    let owner: string | undefined;
    if (c.taskId && taskMap.has(c.taskId)) {
      const t = taskMap.get(c.taskId)!;
      targetType = "task";
      targetId = t.id;
      targetTitle = t.title;
      owner = t.createdBy;
    } else if (c.ideaId && ideaMap.has(c.ideaId)) {
      const i = ideaMap.get(c.ideaId)!;
      targetType = "idea";
      targetId = i.id;
      targetTitle = i.title;
      owner = i.suggestedById;
    }
    if (!targetType) continue;

    const mentionsMe = !!(mentionRe && c.body && mentionRe.test(c.body));
    const ownedByMe = owner === currentUserId;
    if (!mentionsMe && !ownedByMe) continue;

    out.push({
      id: c.id,
      kind: mentionsMe ? "mention" : "comment",
      actorId: c.authorId,
      targetType,
      targetId,
      targetTitle,
      snippet: c.body,
      createdAt: c.createdAt,
    });
  }

  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out.slice(0, 50);
}
