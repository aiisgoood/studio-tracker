"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { Status, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";

const DOT: Record<Status, string> = {
  todo: "var(--color-todo)",
  doing: "var(--color-doing)",
  done: "var(--color-done)",
};

const EMPTY_COPY: Record<Status, string> = {
  todo: "Nothing to do yet — add a task.",
  doing: "Nobody's working on anything.",
  done: "No wins yet. Go make some.",
};

export function Column({
  status,
  label,
  tasks,
  currentUserId,
  onClaim,
  onDelete,
  onOpen,
  onComments,
  commentCounts,
}: {
  status: Status;
  label: string;
  tasks: Task[];
  currentUserId: string | null;
  onClaim: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onOpen: (task: Task) => void;
  onComments: (task: Task) => void;
  commentCounts: Record<string, number>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ background: DOT[status] }}
        />
        <h2 className="text-sm font-semibold text-ink">{label}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-32 flex-1 flex-col gap-2.5 rounded-2xl p-2 transition-colors duration-200",
          isOver
            ? "bg-surface-2 ring-2 ring-[var(--ring)]"
            : "bg-transparent ring-2 ring-transparent",
        ].join(" ")}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            >
              <TaskCard
                task={task}
                currentUserId={currentUserId}
                onClaim={onClaim}
                onDelete={onDelete}
                onOpen={onOpen}
                onComments={onComments}
                commentCount={commentCounts[task.id] ?? 0}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 py-6 text-center"
          >
            <p className="text-xs text-muted-foreground">{EMPTY_COPY[status]}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
