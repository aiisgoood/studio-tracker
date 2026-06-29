/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Comment, CommentTarget } from "@/lib/types";
import { MEMBERS, memberById } from "@/lib/data";
import * as db from "@/lib/db";
import { Avatar, Icon } from "./parts";
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

const MEMBER_NAMES = new Set(MEMBERS.map((m) => m.name.toLowerCase()));

/** Render comment text with @mentions highlighted as pills. */
function renderBody(text: string) {
  return text.split(/(@\w+)/g).map((part, i) => {
    if (part.startsWith("@") && MEMBER_NAMES.has(part.slice(1).toLowerCase())) {
      return (
        <span
          key={i}
          className="rounded bg-primary/15 px-1 font-medium text-primary"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // @mention autocomplete
  const [mention, setMention] = useState<{ query: string; start: number; caret: number } | null>(null);
  const [hi, setHi] = useState(0);
  const matches = mention
    ? MEMBERS.filter((m) => m.name.toLowerCase().startsWith(mention.query.toLowerCase()))
    : [];
  const showMentions = !!mention && matches.length > 0;

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

  // keep the thread pinned to the latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments.length]);

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

  function onBodyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setBody(v);
    const caret = e.target.selectionStart ?? v.length;
    const m = v.slice(0, caret).match(/(?:^|\s)@(\w*)$/);
    if (m) {
      setMention({ query: m[1], start: caret - m[1].length - 1, caret });
      setHi(0);
    } else {
      setMention(null);
    }
  }

  function applyMention(member: (typeof MEMBERS)[number]) {
    if (!mention) return;
    const before = body.slice(0, mention.start);
    const after = body.slice(mention.caret);
    const inserted = `@${member.name} `;
    const next = before + inserted + after;
    setBody(next);
    setMention(null);
    const pos = (before + inserted).length;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(matches[hi]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

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
      setMention(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* thread */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Icon name="comment" size={20} />
            </span>
            <p className="text-sm font-medium text-foreground">No comments yet</p>
            <p className="max-w-[15rem] text-xs text-muted-foreground">
              Start the thread — type <span className="font-medium text-primary">@</span> to
              mention a teammate.
            </p>
          </div>
        )}

        {comments.map((c) => {
          const author = memberById(c.authorId);
          const mine = !!currentUserId && c.authorId === currentUserId;
          return (
            <div
              key={c.id}
              className={["group flex gap-2.5", mine ? "flex-row-reverse" : ""].join(" ")}
            >
              {author ? (
                <Avatar member={author} size={28} ring="var(--card)" />
              ) : (
                <span className="size-7 shrink-0 rounded-full bg-muted" />
              )}
              <div
                className={[
                  "flex min-w-0 max-w-[82%] flex-col",
                  mine ? "items-end" : "items-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "mb-1 flex items-center gap-2 px-1",
                    mine ? "flex-row-reverse" : "",
                  ].join(" ")}
                >
                  <span className="text-xs font-medium capitalize text-foreground">
                    {mine ? "You" : author?.name ?? "someone"}
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
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-[var(--color-prio-urgent)] group-hover:opacity-100"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>

                <div
                  className={[
                    "px-3 py-2 text-sm leading-relaxed text-foreground",
                    mine
                      ? "rounded-2xl rounded-tr-sm bg-primary/10"
                      : "rounded-2xl rounded-tl-sm bg-secondary",
                  ].join(" ")}
                >
                  {c.body && (
                    <p className="break-words [overflow-wrap:anywhere]">
                      {renderBody(c.body)}
                    </p>
                  )}
                  {c.imageUrl && (
                    <a href={c.imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={c.imageUrl}
                        alt="attachment"
                        className={[
                          "max-h-48 rounded-lg border border-border object-cover",
                          c.body ? "mt-2" : "",
                        ].join(" ")}
                      />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* composer */}
      <div
        {...dropProps}
        className={[
          "relative mt-3 rounded-2xl border bg-secondary p-2 transition-colors",
          dragging ? "border-dashed border-primary bg-primary/5" : "border-border",
        ].join(" ")}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-secondary/80 text-xs font-medium text-primary">
            Drop image to attach
          </div>
        )}

        {/* @mention dropdown — appears above the input */}
        {showMentions && (
          <div className="absolute bottom-full left-2 right-2 z-20 mb-2 max-h-52 overflow-y-auto rounded-xl border border-line bg-popover p-1 shadow-xl">
            {matches.map((m, i) => (
              <button
                key={m.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyMention(m);
                }}
                onMouseEnter={() => setHi(i)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  i === hi ? "bg-secondary" : "",
                ].join(" ")}
              >
                <Avatar member={m} size={24} ring="var(--popover)" />
                <span className="capitalize text-foreground">{m.name}</span>
              </button>
            ))}
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

        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={body}
            onChange={onBodyChange}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(() => setMention(null), 120)}
            placeholder="Write a comment… use @ to mention"
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-50"
          >
            <Icon name="image" size={18} />
          </button>
          <button
            onClick={send}
            disabled={sending || uploading || (!body.trim() && !pendingImage)}
            aria-label="Send comment"
            className="btn-pop flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40"
          >
            <Icon name="send" size={15} />
          </button>
        </div>
        {uploading && (
          <p className="mt-1 px-1 text-[11px] text-muted-foreground">Uploading image…</p>
        )}
      </div>
    </div>
  );
}
