/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Comment, CommentTarget } from "@/lib/types";
import { memberById } from "@/lib/data";
import * as db from "@/lib/db";
import { Avatar, Icon } from "./parts";
import { Button } from "@/components/ui/button";
import { useImageDrop } from "@/lib/useImageDrop";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Comments({
  target,
  currentUserId,
}: {
  target: CommentTarget;
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    db.fetchComments(target)
      .then((c) => !cancelled && setComments(c))
      .catch(console.error);
    const unsub = db.subscribeComments(target, (e) => {
      if (e.type === "DELETE") setComments((p) => p.filter((c) => c.id !== e.id));
      else if (e.row)
        setComments((p) => (p.some((c) => c.id === e.row!.id) ? p : [...p, e.row!]));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [target.kind, target.id]);

  async function pickImage(file: File) {
    setUploading(true);
    try {
      const url = await db.uploadImage(file);
      setPendingImage(url);
    } catch (e) {
      console.error(e);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const { dragging, dropProps } = useImageDrop(pickImage);

  async function send() {
    if (!currentUserId || (!body.trim() && !pendingImage) || sending) return;
    setSending(true);
    try {
      const created = await db.addComment({
        target,
        authorId: currentUserId,
        body: body.trim() || undefined,
        imageUrl: pendingImage ?? undefined,
      });
      setComments((p) => (p.some((c) => c.id === created.id) ? p : [...p, created]));
      setBody("");
      setPendingImage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Comments {comments.length > 0 && `· ${comments.length}`}
      </p>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments yet.</p>
        )}
        {comments.map((c) => {
          const author = memberById(c.authorId);
          return (
            <div key={c.id} className="group flex gap-2.5">
              {author ? (
                <Avatar member={author} size={26} ring="var(--card)" />
              ) : (
                <span className="size-[26px] rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize text-foreground">
                    {author?.name ?? "someone"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeLabel(c.createdAt)}
                  </span>
                  <button
                    onClick={() => {
                      setComments((p) => p.filter((x) => x.id !== c.id));
                      db.deleteComment(c.id).catch(console.error);
                    }}
                    aria-label="Delete comment"
                    className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-[var(--color-prio-urgent)] group-hover:opacity-100"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
                {c.body && (
                  <p className="text-sm break-words text-foreground">{c.body}</p>
                )}
                {c.imageUrl && (
                  <a href={c.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={c.imageUrl}
                      alt="attachment"
                      className="mt-1 max-h-44 rounded-lg border border-border object-cover"
                    />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* composer */}
      <div
        {...dropProps}
        className={[
          "relative mt-3 rounded-xl border bg-secondary p-2 transition-colors",
          dragging ? "border-dashed border-primary bg-primary/5" : "border-border",
        ].join(" ")}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-secondary/80 text-xs font-medium text-primary">
            Drop image to attach
          </div>
        )}
        {pendingImage && (
          <div className="relative mb-2 inline-block">
            <img
              src={pendingImage}
              alt="to attach"
              className="max-h-28 rounded-lg border border-border"
            />
            <button
              onClick={() => setPendingImage(null)}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 rounded-full bg-foreground p-0.5 text-background"
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Write a comment…"
            className="min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Attach image"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-50"
          >
            <Icon name="image" size={18} />
          </button>
          <Button
            size="sm"
            onClick={send}
            disabled={sending || uploading || (!body.trim() && !pendingImage)}
          >
            <Icon name="send" size={15} />
          </Button>
        </div>
        {uploading && (
          <p className="mt-1 px-1 text-[11px] text-muted-foreground">Uploading image…</p>
        )}
      </div>
    </div>
  );
}
