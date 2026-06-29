"use client";

import { Project, STATUSES, Status, Task } from "@/lib/types";
import { DuePill, Icon } from "./parts";

function TaskRow({
  task,
  projectName,
  commentCount,
  onOpen,
}: {
  task: Task;
  projectName: string;
  commentCount: number;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(task.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-[color-mix(in_oklab,var(--color-primary)_50%,var(--color-line))]"
    >
      <span
        title={`${task.priority} priority`}
        className="size-2 shrink-0 rounded-full"
        style={{ background: `var(--color-prio-${task.priority})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">{projectName}</p>
      </div>
      {commentCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="comment" size={13} />
          {commentCount}
        </span>
      )}
      <DuePill dueDate={task.dueDate} status={task.status} />
    </button>
  );
}

export function MyTasksPage({
  tasks,
  projects,
  currentUserId,
  commentCounts,
  onOpenTask,
}: {
  tasks: Task[];
  projects: Project[];
  currentUserId: string | null;
  commentCounts: Record<string, number>;
  onOpenTask: (id: string) => void;
}) {
  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? "—";

  const mine = currentUserId
    ? tasks.filter((t) => t.assigneeIds.includes(currentUserId))
    : [];
  const upForGrabs = tasks.filter((t) => t.assigneeIds.length === 0);

  const byStatus = (s: Status) => mine.filter((t) => t.status === s);
  const STATUS_COLOR: Record<Status, string> = {
    todo: "var(--color-todo)",
    doing: "var(--color-doing)",
    done: "var(--color-done)",
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">My tasks</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everything assigned to you, across every project.
        </p>
      </div>

      {mine.length === 0 && upForGrabs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing assigned to you right now. Enjoy the calm. 🌤️
          </p>
        </div>
      )}

      <div className="space-y-6">
        {STATUSES.map((s) => {
          const list = byStatus(s.id);
          if (list.length === 0) return null;
          return (
            <section key={s.id}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: STATUS_COLOR[s.id] }}
                />
                <h2 className="text-sm font-semibold text-ink">{s.label}</h2>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    projectName={projectName(t.projectId)}
                    commentCount={commentCounts[t.id] ?? 0}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {upForGrabs.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Icon name="user" size={14} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-ink">Up for grabs</h2>
              <span className="text-xs text-muted-foreground">
                {upForGrabs.length} unassigned
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {upForGrabs.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  projectName={projectName(t.projectId)}
                  commentCount={commentCounts[t.id] ?? 0}
                  onOpen={onOpenTask}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
