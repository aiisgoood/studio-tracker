import { supabase } from "./supabase";
import {
  Comment,
  CommentTarget,
  Competitor,
  Idea,
  IdeaStatus,
  Priority,
  Project,
  Status,
  Task,
} from "./types";

/* ---------- row → app-type mappers ---------- */

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_ids: string[] | null;
  due_date: string | null;
  image_urls: string[] | null;
  created_by: string | null;
  created_at: string;
};

type IdeaRow = {
  id: string;
  title: string;
  pitch: string | null;
  description: string | null;
  competitors: Competitor[] | null;
  tags: string[] | null;
  image_urls: string[] | null;
  suggested_by: string | null;
  status: string;
  votes: string[] | null;
  created_at: string;
  updated_at: string | null;
};

type ProjectRow = { id: string; name: string };

function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status as Status,
    priority: r.priority as Priority,
    assigneeIds: r.assignee_ids ?? [],
    dueDate: r.due_date ?? undefined,
    imageUrls: r.image_urls ?? [],
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
  };
}

type CommentRow = {
  id: string;
  task_id: string | null;
  idea_id: string | null;
  author_id: string | null;
  body: string | null;
  image_url: string | null;
  created_at: string;
};

function toComment(r: CommentRow): Comment {
  return {
    id: r.id,
    taskId: r.task_id ?? undefined,
    ideaId: r.idea_id ?? undefined,
    authorId: r.author_id ?? "",
    body: r.body ?? undefined,
    imageUrl: r.image_url ?? undefined,
    createdAt: r.created_at,
  };
}

/** Column on `comments` that holds the parent id for a given target. */
function targetColumn(t: CommentTarget): "task_id" | "idea_id" {
  return t.kind === "task" ? "task_id" : "idea_id";
}

function toIdea(r: IdeaRow): Idea {
  return {
    id: r.id,
    title: r.title,
    pitch: r.pitch ?? undefined,
    description: r.description ?? undefined,
    competitors: r.competitors ?? [],
    tags: r.tags ?? [],
    imageUrls: r.image_urls ?? [],
    suggestedById: r.suggested_by ?? "",
    status: r.status as IdeaStatus,
    votes: r.votes ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
  };
}

function db() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

/* ---------- reads ---------- */

export async function fetchEverything(): Promise<{
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
}> {
  const [projects, tasks, ideas] = await Promise.all([
    db().from("projects").select("*").order("created_at", { ascending: true }),
    db().from("tasks").select("*").order("created_at", { ascending: false }),
    db().from("ideas").select("*").order("created_at", { ascending: false }),
  ]);
  if (projects.error) throw projects.error;
  if (tasks.error) throw tasks.error;
  if (ideas.error) throw ideas.error;
  return {
    projects: (projects.data as ProjectRow[]).map((p) => ({ id: p.id, name: p.name })),
    tasks: (tasks.data as TaskRow[]).map(toTask),
    ideas: (ideas.data as IdeaRow[]).map(toIdea),
  };
}

/* ---------- tasks ---------- */

export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate?: string;
  imageUrls?: string[];
  createdBy: string | null;
}): Promise<Task> {
  const { data, error } = await db()
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status: "todo",
      priority: input.priority,
      assignee_ids: input.assigneeIds,
      due_date: input.dueDate ?? null,
      image_urls: input.imageUrls ?? [],
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTask(data as TaskRow);
}

export async function updateTaskStatus(id: string, status: Status) {
  const { error } = await db().from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateTaskAssignees(id: string, assigneeIds: string[]) {
  const { error } = await db()
    .from("tasks")
    .update({ assignee_ids: assigneeIds })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await db().from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTask(
  id: string,
  fields: {
    title?: string;
    description?: string | null;
    priority?: Priority;
    dueDate?: string | null;
    assigneeIds?: string[];
    status?: Status;
    imageUrls?: string[];
  }
) {
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.description !== undefined) patch.description = fields.description;
  if (fields.priority !== undefined) patch.priority = fields.priority;
  if (fields.dueDate !== undefined) patch.due_date = fields.dueDate;
  if (fields.assigneeIds !== undefined) patch.assignee_ids = fields.assigneeIds;
  if (fields.status !== undefined) patch.status = fields.status;
  if (fields.imageUrls !== undefined) patch.image_urls = fields.imageUrls;
  const { error } = await db().from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------- projects ---------- */

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await db()
    .from("projects")
    .insert({ name })
    .select("*")
    .single();
  if (error) throw error;
  const row = data as ProjectRow;
  return { id: row.id, name: row.name };
}

export async function updateProject(id: string, name: string) {
  const { error } = await db().from("projects").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  // tasks cascade-delete via the FK on the projects table
  const { error } = await db().from("projects").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- ideas ---------- */

export async function createIdea(input: {
  title: string;
  pitch?: string;
  suggestedById: string;
}): Promise<Idea> {
  const { data, error } = await db()
    .from("ideas")
    .insert({
      title: input.title,
      pitch: input.pitch ?? null,
      suggested_by: input.suggestedById,
      status: "new",
      votes: [input.suggestedById],
    })
    .select("*")
    .single();
  if (error) throw error;
  return toIdea(data as IdeaRow);
}

export async function updateIdeaVotes(id: string, votes: string[]) {
  const { error } = await db().from("ideas").update({ votes }).eq("id", id);
  if (error) throw error;
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  const { error } = await db().from("ideas").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateIdea(
  id: string,
  fields: {
    title?: string;
    pitch?: string | null;
    description?: string | null;
    competitors?: Competitor[];
    tags?: string[];
    imageUrls?: string[];
    status?: IdeaStatus;
  }
) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.pitch !== undefined) patch.pitch = fields.pitch;
  if (fields.description !== undefined) patch.description = fields.description;
  if (fields.competitors !== undefined) patch.competitors = fields.competitors;
  if (fields.tags !== undefined) patch.tags = fields.tags;
  if (fields.imageUrls !== undefined) patch.image_urls = fields.imageUrls;
  if (fields.status !== undefined) patch.status = fields.status;
  const { error } = await db().from("ideas").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteIdea(id: string) {
  const { error } = await db().from("ideas").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- comments ---------- */

export async function fetchComments(target: CommentTarget): Promise<Comment[]> {
  const { data, error } = await db()
    .from("comments")
    .select("*")
    .eq(targetColumn(target), target.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as CommentRow[]).map(toComment);
}

/** How many comments each task has, keyed by task id. */
export async function fetchCommentCounts(): Promise<Record<string, number>> {
  const { data, error } = await db()
    .from("comments")
    .select("task_id")
    .not("task_id", "is", null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data as { task_id: string }[]) {
    counts[r.task_id] = (counts[r.task_id] ?? 0) + 1;
  }
  return counts;
}

/** How many comments each idea has, keyed by idea id. */
export async function fetchIdeaCommentCounts(): Promise<Record<string, number>> {
  const { data, error } = await db()
    .from("comments")
    .select("idea_id")
    .not("idea_id", "is", null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data as { idea_id: string }[]) {
    counts[r.idea_id] = (counts[r.idea_id] ?? 0) + 1;
  }
  return counts;
}

export async function addComment(input: {
  target: CommentTarget;
  authorId: string;
  body?: string;
  imageUrl?: string;
}): Promise<Comment> {
  const { data, error } = await db()
    .from("comments")
    .insert({
      task_id: input.target.kind === "task" ? input.target.id : null,
      idea_id: input.target.kind === "idea" ? input.target.id : null,
      author_id: input.authorId,
      body: input.body ?? null,
      image_url: input.imageUrl ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toComment(data as CommentRow);
}

export async function deleteComment(id: string) {
  const { error } = await db().from("comments").delete().eq("id", id);
  if (error) throw error;
}

/** Live comments for one task or idea. Returns an unsubscribe function. */
export function subscribeComments(
  target: CommentTarget,
  cb: (e: { type: "INSERT" | "DELETE"; row?: Comment; id?: string }) => void
): () => void {
  const client = db();
  const col = targetColumn(target);
  const channel = client
    .channel(`comments-${target.kind}-${target.id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `${col}=eq.${target.id}` },
      (p) => {
        if (p.eventType === "DELETE") cb({ type: "DELETE", id: (p.old as { id: string }).id });
        else if (p.eventType === "INSERT") cb({ type: "INSERT", row: toComment(p.new as CommentRow) });
      }
    )
    .subscribe();
  return () => client.removeChannel(channel);
}

/* ---------- image upload (storage) ---------- */

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from("uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = db().storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- realtime ---------- */

type Change<T> =
  | { type: "INSERT" | "UPDATE"; row: T }
  | { type: "DELETE"; id: string };

/**
 * Subscribe to live changes on tasks, ideas and projects.
 * Returns an unsubscribe function.
 */
export function subscribeAll(cb: {
  task: (e: Change<Task>) => void;
  idea: (e: Change<Idea>) => void;
  project: (e: Change<Project>) => void;
  comment?: () => void;
}): () => void {
  const client = db();
  const channel = client
    .channel("studio-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      () => cb.comment?.()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      (p) => {
        if (p.eventType === "DELETE") cb.task({ type: "DELETE", id: (p.old as { id: string }).id });
        else cb.task({ type: p.eventType, row: toTask(p.new as TaskRow) });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ideas" },
      (p) => {
        if (p.eventType === "DELETE") cb.idea({ type: "DELETE", id: (p.old as { id: string }).id });
        else cb.idea({ type: p.eventType, row: toIdea(p.new as IdeaRow) });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projects" },
      (p) => {
        if (p.eventType === "DELETE") cb.project({ type: "DELETE", id: (p.old as { id: string }).id });
        else {
          const r = p.new as ProjectRow;
          cb.project({ type: p.eventType, row: { id: r.id, name: r.name } });
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
