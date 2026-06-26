/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { Competitor, Idea, IdeaStatus, IDEA_STATUSES } from "@/lib/types";
import { memberById } from "@/lib/data";
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

export type IdeaUpdate = {
  title?: string;
  pitch?: string | null;
  description?: string | null;
  competitors?: Competitor[];
  tags?: string[];
  imageUrls?: string[];
  status?: IdeaStatus;
};

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IdeaDialog({
  idea,
  onClose,
  onSave,
  onDelete,
  onOpenComments,
}: {
  idea: Idea | null;
  onClose: () => void;
  onSave: (id: string, fields: IdeaUpdate) => void;
  onDelete: (id: string) => void;
  onOpenComments: (idea: Idea) => void;
}) {
  return (
    <Dialog open={!!idea} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {idea && (
          <Body
            idea={idea}
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
  idea,
  onSave,
  onDelete,
  onClose,
  onOpenComments,
}: {
  idea: Idea;
  onSave: (id: string, fields: IdeaUpdate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onOpenComments: (idea: Idea) => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [pitch, setPitch] = useState(idea.pitch ?? "");
  const [description, setDescription] = useState(idea.description ?? "");
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [tags, setTags] = useState<string[]>(idea.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>(idea.competitors);
  const [imageUrls, setImageUrls] = useState<string[]>(idea.imageUrls);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const author = idea.suggestedById ? memberById(idea.suggestedById) : undefined;

  function addTag() {
    const t = tagDraft.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagDraft("");
  }

  function setCompetitor(i: number, patch: Partial<Competitor>) {
    setCompetitors((p) => p.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
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

  function save() {
    if (!title.trim()) return;
    onSave(idea.id, {
      title: title.trim(),
      pitch: pitch.trim() || null,
      description: description.trim() || null,
      tags,
      competitors: competitors
        .map((c) => ({ name: c.name.trim(), url: c.url?.trim() || undefined }))
        .filter((c) => c.name),
      imageUrls,
      status,
    });
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Idea</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Input
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="One-line pitch"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description — the problem, who it's for, why now…"
          rows={4}
        />

        {/* status */}
        <div>
          <Label className="mb-1.5 text-muted-foreground">Stage</Label>
          <div className="flex gap-1.5">
            {IDEA_STATUSES.map((s) => (
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

        {/* tags */}
        <div>
          <Label className="mb-1.5 text-muted-foreground">Tags</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground"
              >
                {t}
                <button
                  onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  aria-label={`Remove ${t}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="add tag…"
              className="min-w-[90px] flex-1 bg-transparent px-1 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* competitors */}
        <div>
          <Label className="mb-1.5 text-muted-foreground">Competitors / prior art</Label>
          <div className="space-y-2">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={c.name}
                  onChange={(e) => setCompetitor(i, { name: e.target.value })}
                  placeholder="Name"
                  className="flex-1"
                />
                <Input
                  value={c.url ?? ""}
                  onChange={(e) => setCompetitor(i, { url: e.target.value })}
                  placeholder="https://…"
                  className="flex-1"
                />
                <button
                  onClick={() => setCompetitors((p) => p.filter((_, idx) => idx !== i))}
                  aria-label="Remove competitor"
                  className="rounded-md p-1.5 text-muted-foreground transition hover:text-[var(--color-prio-urgent)]"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCompetitors((p) => [...p, { name: "", url: "" }])}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Icon name="plus" size={14} />
              Add competitor
            </button>
          </div>
        </div>

        {/* images */}
        <div>
          <Label className="mb-1.5 text-muted-foreground">Images</Label>
          <div className="flex flex-wrap items-center gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                <a href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt="reference"
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

        {/* meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {author && (
            <span className="flex items-center gap-1.5">
              Suggested by
              <Avatar member={author} size={18} ring="var(--card)" />
              <span className="capitalize text-foreground">{author.name}</span>
            </span>
          )}
          <span>· Added {dateLabel(idea.createdAt)}</span>
          {idea.updatedAt && idea.updatedAt !== idea.createdAt && (
            <span>· Edited {dateLabel(idea.updatedAt)}</span>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => onOpenComments(idea)}
        >
          <Icon name="comment" size={16} />
          Discussion
        </Button>
      </div>

      <DialogFooter className="mt-2 flex-row items-center justify-between sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm(`Delete idea "${idea.title}"?`)) {
              onDelete(idea.id);
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
