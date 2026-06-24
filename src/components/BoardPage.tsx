"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { Priority, Project, Status, STATUSES, Task } from "@/lib/types";
import { Column } from "./Column";
import { NewTaskModal } from "./NewTaskModal";
import { TaskDialog, TaskUpdate } from "./TaskDialog";
import { CommentsDialog } from "./CommentsDialog";
import { Confetti, Icon } from "./parts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type NewTaskDraft = {
  projectId: string;
  title: string;
  description?: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate?: string;
  imageUrls?: string[];
};

export function BoardPage({
  tasks,
  projects,
  currentProjectId,
  setCurrentProjectId,
  currentUserId,
  commentCounts,
  onAddProject,
  onCreateTask,
  onMoveTask,
  onClaimTask,
  onDeleteTask,
  onUpdateTask,
  onRenameProject,
  onDeleteProject,
}: {
  tasks: Task[];
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  currentUserId: string | null;
  commentCounts: Record<string, number>;
  onAddProject: () => void;
  onCreateTask: (draft: NewTaskDraft) => void;
  onMoveTask: (id: string, status: Status) => void;
  onClaimTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, fields: TaskUpdate) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  );

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === currentProjectId),
    [tasks, currentProjectId]
  );
  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null;
  const commentTask = commentTaskId
    ? tasks.find((t) => t.id === commentTaskId) ?? null
    : null;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as Status;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    if (newStatus === "done") {
      setConfettiKey((k) => k + 1);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 800);
    }
    onMoveTask(task.id, newStatus);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
          {projects.map((p) => {
            const active = p.id === currentProjectId;
            return (
              <div key={p.id} className="flex shrink-0 items-center">
                <motion.button
                  onClick={() => setCurrentProjectId(p.id)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={[
                    "relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {active && (
                    <motion.span
                      layoutId="project-pill"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      className="absolute inset-0 -z-10 rounded-full bg-primary"
                    />
                  )}
                  {p.name}
                </motion.button>
                {active && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          aria-label="Project options"
                          className="ml-0.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Icon name="dots" size={16} />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget(p);
                          setRenameValue(p.name);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(`Delete project "${p.name}" and all its tasks?`)
                          )
                            onDeleteProject(p.id);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
          <button
            onClick={onAddProject}
            aria-label="Add project"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>

        <Button onClick={() => setShowNew(true)} className="shrink-0 rounded-full">
          <Icon name="plus" size={16} />
          <span className="hidden sm:block">New task</span>
        </Button>
      </div>

      <div className="relative">
        {celebrate && (
          <div className="pointer-events-none absolute right-0 top-24 z-30 hidden w-1/3 sm:block">
            <Confetti key={confettiKey} />
          </div>
        )}
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STATUSES.map((s) => (
              <Column
                key={s.id}
                status={s.id}
                label={s.label}
                tasks={projectTasks.filter((t) => t.status === s.id)}
                currentUserId={currentUserId}
                onClaim={onClaimTask}
                onDelete={onDeleteTask}
                onOpen={(t) => setOpenTaskId(t.id)}
                onComments={(t) => setCommentTaskId(t.id)}
                commentCounts={commentCounts}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* New task */}
      <AnimatePresence>
        {showNew && (
          <NewTaskModal
            projectId={currentProjectId}
            onClose={() => setShowNew(false)}
            onCreate={(draft) => {
              onCreateTask(draft);
              setShowNew(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit task */}
      <TaskDialog
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        onSave={onUpdateTask}
        onDelete={onDeleteTask}
        onOpenComments={(t) => {
          setOpenTaskId(null);
          setCommentTaskId(t.id);
        }}
      />

      {/* Comments */}
      <CommentsDialog
        task={commentTask}
        currentUserId={currentUserId}
        onClose={() => setCommentTaskId(null)}
      />

      {/* Rename project */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim() && renameTarget) {
                onRenameProject(renameTarget.id, renameValue.trim());
                setRenameTarget(null);
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renameTarget && renameValue.trim()) {
                  onRenameProject(renameTarget.id, renameValue.trim());
                  setRenameTarget(null);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
