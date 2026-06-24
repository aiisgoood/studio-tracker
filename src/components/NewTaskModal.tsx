/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Priority, PRIORITIES } from "@/lib/types";
import { MEMBERS } from "@/lib/data";
import * as db from "@/lib/db";
import { NewTaskDraft } from "./BoardPage";
import { Avatar, Icon } from "./parts";

export function NewTaskModal({
  projectId,
  onClose,
  onCreate,
}: {
  projectId: string;
  onClose: () => void;
  onCreate: (draft: NewTaskDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  function submit() {
    if (!title.trim()) return;
    onCreate({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeIds,
      dueDate: dueDate || undefined,
      imageUrls,
    });
  }

  const prioColor: Record<Priority, string> = {
    low: "var(--color-prio-low)",
    medium: "var(--color-prio-medium)",
    urgent: "var(--color-prio-urgent)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-line bg-surface p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New task</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-2"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What needs doing?"
          className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a little detail (optional)"
          rows={2}
          className="mt-2.5 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Priority
            </label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium capitalize transition-colors",
                    priority === p.id
                      ? "border-primary bg-surface-2 text-ink"
                      : "border-line text-muted-foreground hover:text-ink",
                  ].join(" ")}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: prioColor[p.id] }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Assign to{" "}
            <span className="font-normal">
              · leave empty for &ldquo;up for grabs&rdquo;
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((m) => {
              const on = assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleAssignee(m.id)}
                  className={[
                    "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm capitalize transition-all",
                    on
                      ? "border-primary bg-surface-2 text-ink"
                      : "border-line text-muted-foreground hover:text-ink",
                  ].join(" ")}
                >
                  <Avatar member={m} size={24} ring="var(--surface)" />
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Images
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt="attachment"
                  className="size-14 rounded-lg border border-line object-cover"
                />
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
              className="flex size-14 items-center justify-center rounded-lg border border-dashed border-line text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <Icon name={uploading ? "refresh" : "image"} size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Add task
          </button>
        </div>
      </motion.div>
    </div>
  );
}
