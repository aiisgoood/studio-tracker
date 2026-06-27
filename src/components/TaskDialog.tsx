/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { Priority, PRIORITIES, Status, STATUSES, Task } from "@/lib/types";
import { MEMBERS, memberById } from "@/lib/data";
import * as db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, Icon } from "./parts";
import { useImageDrop } from "@/lib/useImageDrop";

const PRIO_COLOR: Record<Priority, string> = {
  low: "var(--color-prio-low)",
  medium: "var(--color-prio-medium)",
  urgent: "var(--color-prio-urgent)",
};

export type TaskUpdate = {
  title?: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: string | null;
  assigneeIds?: string[];
  status?: Status;
  imageUrls?: string[];
};

export function TaskDialog({
  task,
  onClose,
  onSave,
  onDelete,
  onOpenComments,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, fields: TaskUpdate) => void;
  onDelete: (id: string) => void;
  onOpenComments: (task: Task) => void;
}) {
  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {task && (
          <Body
            task={task}
            onSave={onSave}
            onDelete={onDelete}
            onClose={onClose}
            onOpenComments={onOpenComments}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  task,
  onSave,
  onDelete,
  onClose,
  onOpenComments,
}: {
  task: Task;
  onSave: (id: string, fields: TaskUpdate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onOpenComments: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds);
  const [imageUrls, setImageUrls] = useState<string[]>(task.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const creator = task.createdBy ? memberById(task.createdBy) : undefined;

  function toggleAssignee(id: string) {
    setAssigneeIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function addImage(file: File) {
    setUploading(true);
    try {
      const url = await db.uploadImage(file);
      setImageUrls((p) => [...p, url]);
    } catch (e) {
      console.error(e);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const { dragging, dropProps } = useImageDrop(addImage);

  function save() {
    if (!title.trim()) return;
    onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      dueDate: dueDate || null,
      assigneeIds,
      imageUrls,
    });
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Task</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 text-muted-foreground">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 text-muted-foreground">Column</Label>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={[
                    "flex-1 rounded-md border px-1 py-2 text-xs font-medium transition-colors",
                    status === s.id
                      ? "border-primary bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-muted-foreground">Priority</Label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium capitalize transition-colors",
                  priority === p.id
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="size-2 rounded-full" style={{ background: PRIO_COLOR[p.id] }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-muted-foreground">
            Assigned · empty = up for grabs
          </Label>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((m) => {
              const on = assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleAssignee(m.id)}
                  className={[
                    "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm capitalize transition-colors",
                    on
                      ? "border-primary bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <Avatar member={m} size={24} ring="var(--card)" />
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* images */}
        <div>
          <Label className="mb-1.5 text-muted-foreground">Images</Label>
          <div
            {...dropProps}
            className={[
              "flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-2 transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-transparent",
            ].join(" ")}
          >
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                <a href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt="attachment"
                    className="size-16 rounded-lg border border-border object-cover"
                  />
                </a>
                <button
                  onClick={() => setImageUrls((p) => p.filter((u) => u !== url))}
                  aria-label="Remove image"
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background"
                >
                  <Icon name="x" size={11} />
                </button>
              </div>
            ))}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <Icon name={uploading ? "refresh" : "image"} size={18} />
            </button>
          </div>
        </div>

        {creator && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Created by
            <Avatar member={creator} size={18} ring="var(--card)" />
            <span className="capitalize text-foreground">{creator.name}</span>
          </p>
        )}

        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => onOpenComments(task)}
        >
          <Icon name="comment" size={16} />
          Comments
        </Button>
      </div>

      <DialogFooter className="mt-2 flex-row items-center justify-between sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm(`Delete "${task.title}"?`)) {
              onDelete(task.id);
              onClose();
            }
          }}
          className="text-[var(--color-prio-urgent)] hover:text-[var(--color-prio-urgent)]"
        >
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
