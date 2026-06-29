"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Idea, IdeaStatus } from "@/lib/types";
import { memberById } from "@/lib/data";
import { Avatar, Icon } from "./parts";
import { IdeaDialog, IdeaUpdate } from "./IdeaDialog";
import { CommentsPanel } from "./CommentsPanel";

const STATUS_STYLE: Record<IdeaStatus, { bg: string; ink: string }> = {
  new: { bg: "var(--color-slate-bg)", ink: "var(--color-slate-ink)" },
  exploring: { bg: "var(--color-amber-bg)", ink: "var(--color-amber-ink)" },
  building: { bg: "var(--color-sage-bg)", ink: "var(--color-sage-ink)" },
  parked: { bg: "var(--surface-2)", ink: "var(--muted-foreground)" },
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function IdeasPage({
  ideas,
  currentUserId,
  ideaCommentCounts,
  onAddIdea,
  onToggleVote,
  onCycleStatus,
  onDeleteIdea,
  onUpdateIdea,
  onConvertToProject,
  focusCommentIdeaId,
  onFocusConsumed,
}: {
  ideas: Idea[];
  currentUserId: string | null;
  ideaCommentCounts: Record<string, number>;
  onAddIdea: (title: string, pitch?: string) => void;
  onToggleVote: (id: string) => void;
  onCycleStatus: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onUpdateIdea: (id: string, fields: IdeaUpdate) => void;
  onConvertToProject: (idea: Idea) => void;
  focusCommentIdeaId?: string | null;
  onFocusConsumed?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commentsId, setCommentsId] = useState<string | null>(null);

  const sorted = [...ideas].sort((a, b) => b.votes.length - a.votes.length);
  const leaderId = sorted[0] && sorted[0].votes.length > 0 ? sorted[0].id : null;

  const editingIdea = editingId ? ideas.find((i) => i.id === editingId) ?? null : null;
  const commentsIdea = commentsId ? ideas.find((i) => i.id === commentsId) ?? null : null;

  // open an idea's comments when a notification deep-links to it
  useEffect(() => {
    if (focusCommentIdeaId && ideas.some((i) => i.id === focusCommentIdeaId)) {
      setCommentsId(focusCommentIdeaId);
      onFocusConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCommentIdeaId]);

  function add() {
    if (!title.trim()) return;
    onAddIdea(title.trim(), pitch.trim() || undefined);
    setTitle("");
    setPitch("");
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Ideas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dump every business idea here. Vote the best up, then turn winners into projects.
        </p>
      </div>

      {/* add idea */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="A new idea…"
          className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="mt-2 flex gap-2">
          <input
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="One-line pitch (optional)"
            className="flex-1 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            onClick={add}
            disabled={!title.trim()}
            className="btn-pop shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-all disabled:opacity-50"
          >
            Add idea
          </button>
        </div>
      </div>

      {/* idea cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {sorted.map((idea) => {
            const author = memberById(idea.suggestedById);
            const voted = currentUserId ? idea.votes.includes(currentUserId) : false;
            const style = STATUS_STYLE[idea.status];
            const commentCount = ideaCommentCounts[idea.id] ?? 0;
            const isLeader = idea.id === leaderId;
            return (
              <motion.div
                layout
                key={idea.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => setEditingId(idea.id)}
                className={[
                  "group flex cursor-pointer flex-col rounded-2xl border bg-surface p-4 transition-shadow hover:shadow-sm",
                  isLeader ? "border-primary ring-1 ring-primary/40" : "border-line",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCycleStatus(idea.id);
                      }}
                      title="Click to change stage"
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
                      style={{ background: style.bg, color: style.ink }}
                    >
                      {idea.status}
                    </button>
                    {isLeader && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-bg px-2 py-1 text-[11px] font-semibold text-amber-ink">
                        <Icon name="fire" size={11} />
                        Top
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete idea "${idea.title}"?`)) onDeleteIdea(idea.id);
                    }}
                    aria-label="Delete idea"
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-[var(--color-prio-urgent)] group-hover:opacity-100"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>

                <h3 className="text-sm font-semibold leading-snug text-ink">{idea.title}</h3>
                {idea.pitch && (
                  <p className="mt-1 text-xs text-muted-foreground">{idea.pitch}</p>
                )}

                {/* tags */}
                {idea.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {idea.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* meta row: indicators + date */}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {idea.imageUrls.length > 0 && (
                    <span className="flex items-center gap-0.5" title="has images">
                      <Icon name="image" size={12} />
                      {idea.imageUrls.length}
                    </span>
                  )}
                  <span>Added {shortDate(idea.createdAt)}</span>
                  {idea.updatedAt && idea.updatedAt !== idea.createdAt && (
                    <span>· edited {shortDate(idea.updatedAt)}</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {author && <Avatar member={author} size={22} />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVote(idea.id);
                      }}
                      className={[
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        voted
                          ? "border-transparent bg-amber-bg text-amber-ink"
                          : "border-line text-muted-foreground hover:text-ink",
                      ].join(" ")}
                    >
                      <Icon name="fire" size={13} />
                      {idea.votes.length}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentsId(idea.id);
                      }}
                      className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-ink"
                    >
                      <Icon name="comment" size={13} />
                      {commentCount > 0 && commentCount}
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConvertToProject(idea);
                    }}
                    className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    To project
                    <Icon name="arrowRight" size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {ideas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="text-sm text-muted-foreground">No ideas yet — add the first one above. 🚀</p>
        </div>
      )}

      <IdeaDialog
        idea={editingIdea}
        onClose={() => setEditingId(null)}
        onSave={onUpdateIdea}
        onDelete={onDeleteIdea}
        onOpenComments={(i) => {
          setEditingId(null);
          setCommentsId(i.id);
        }}
      />

      <CommentsPanel
        target={commentsIdea ? { kind: "idea", id: commentsIdea.id } : null}
        title={commentsIdea?.title ?? ""}
        currentUserId={currentUserId}
        onClose={() => setCommentsId(null)}
      />
    </div>
  );
}
