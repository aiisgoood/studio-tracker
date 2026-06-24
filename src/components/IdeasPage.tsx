"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Idea, IdeaStatus } from "@/lib/types";
import { memberById } from "@/lib/data";
import { Avatar, Icon } from "./parts";

const STATUS_STYLE: Record<IdeaStatus, { bg: string; ink: string }> = {
  new: { bg: "var(--color-slate-bg)", ink: "var(--color-slate-ink)" },
  exploring: { bg: "var(--color-amber-bg)", ink: "var(--color-amber-ink)" },
  building: { bg: "var(--color-sage-bg)", ink: "var(--color-sage-ink)" },
  parked: { bg: "var(--surface-2)", ink: "var(--muted-foreground)" },
};

export function IdeasPage({
  ideas,
  currentUserId,
  onAddIdea,
  onToggleVote,
  onCycleStatus,
  onDeleteIdea,
  onConvertToProject,
}: {
  ideas: Idea[];
  currentUserId: string | null;
  onAddIdea: (title: string, pitch?: string) => void;
  onToggleVote: (id: string) => void;
  onCycleStatus: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onConvertToProject: (idea: Idea) => void;
}) {
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");

  const sorted = [...ideas].sort((a, b) => b.votes.length - a.votes.length);

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
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:opacity-50"
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
            const voted = currentUserId
              ? idea.votes.includes(currentUserId)
              : false;
            const style = STATUS_STYLE[idea.status];
            return (
              <motion.div
                layout
                key={idea.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => onCycleStatus(idea.id)}
                    title="Click to change stage"
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
                    style={{ background: style.bg, color: style.ink }}
                  >
                    {idea.status}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete idea "${idea.title}"?`)) onDeleteIdea(idea.id);
                    }}
                    aria-label="Delete idea"
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-[var(--color-prio-urgent)] group-hover:opacity-100"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>

                <h3 className="text-sm font-semibold leading-snug text-ink">
                  {idea.title}
                </h3>
                {idea.pitch && (
                  <p className="mt-1 text-xs text-muted-foreground">{idea.pitch}</p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {author && <Avatar member={author} size={22} />}
                    <button
                      onClick={() => onToggleVote(idea.id)}
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
                  </div>

                  <button
                    onClick={() => onConvertToProject(idea)}
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
    </div>
  );
}
