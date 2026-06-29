"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Member, Task } from "@/lib/types";
import { memberById } from "@/lib/data";
import { AvatarStack, DuePill, Icon, PriorityDot } from "./parts";

export function TaskCard({
  task,
  currentUserId,
  onClaim,
  onDelete,
  onOpen,
  onComments,
  commentCount,
}: {
  task: Task;
  currentUserId: string | null;
  onClaim: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onOpen: (task: Task) => void;
  onComments: (task: Task) => void;
  commentCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const assignees = task.assigneeIds
    .map(memberById)
    .filter(Boolean) as Member[];
  const isDone = task.status === "done";
  const upForGrabs = assignees.length === 0 && !isDone;
  const imageCount = task.imageUrls?.length ?? 0;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        const p = downPos.current;
        // ignore the click that fires at the end of a drag
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 5) return;
        onOpen(task);
      }}
      className={[
        "group relative cursor-grab touch-none rounded-2xl border p-3 transition-all duration-200 active:cursor-grabbing",
        isDragging
          ? "scale-[1.02] rotate-[0.6deg] shadow-xl"
          : "shadow-sm hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md",
        isDone
          ? "border-[var(--color-sage-line)] bg-sage-bg"
          : "border-line bg-surface",
      ].join(" ")}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          {!isDone && <PriorityDot priority={task.priority} />}
          {isDone && (
            <span className="mt-0.5 text-sage-ink">
              <Icon name="check" size={15} />
            </span>
          )}
          <p
            className={[
              "text-sm leading-snug",
              isDone ? "text-sage-ink line-through opacity-80" : "text-ink",
            ].join(" ")}
          >
            {task.title}
          </p>
        </div>

        {/* actions: delete */}
        <div className="-mr-1 -mt-1 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${task.title}"?`)) onDelete(task.id);
            }}
            aria-label="Delete task"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-[var(--color-prio-urgent)]"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>

      {task.description && !isDone && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!isDone ? (
            <DuePill dueDate={task.dueDate} status={task.status} />
          ) : (
            <span className="text-[11px] font-medium text-sage-ink">Completed</span>
          )}
          {imageCount > 0 && (
            <span
              title={`${imageCount} image${imageCount > 1 ? "s" : ""} attached`}
              className="flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-1 text-[11px] font-medium text-muted-foreground"
            >
              <Icon name="image" size={13} />
              {imageCount > 1 && imageCount}
            </span>
          )}
          <button
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onComments(task);
            }}
            aria-label={commentCount > 0 ? `${commentCount} comments` : "Add comment"}
            className={[
              "flex items-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-medium transition-colors hover:bg-surface-2 hover:text-foreground",
              commentCount > 0 ? "text-foreground" : "text-muted-foreground",
            ].join(" ")}
          >
            <Icon name="comment" size={14} />
            {commentCount > 0 && commentCount}
          </button>
        </div>

        {upForGrabs ? (
          <button
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (currentUserId) onClaim(task.id);
            }}
            className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Claim
          </button>
        ) : (
          <AvatarStack
            members={assignees}
            ring={isDone ? "var(--color-sage-bg)" : "var(--surface)"}
            glowId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
