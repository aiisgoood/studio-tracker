"use client";

import { MEMBERS } from "@/lib/data";
import { Task } from "@/lib/types";
import { Avatar } from "./parts";

export function TeamPage({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Team</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {`The ${MEMBERS.length} of us. No bosses — just who's on what.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MEMBERS.map((m) => {
          const mine = tasks.filter((t) => t.assigneeIds.includes(m.id));
          const open = mine.filter((t) => t.status !== "done").length;
          const done = mine.filter((t) => t.status === "done").length;
          return (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
            >
              <Avatar member={m} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold capitalize text-ink">
                  {m.name}
                </p>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-semibold text-ink">{open}</span> open
                  </span>
                  <span>
                    <span className="font-semibold text-ink">{done}</span> done
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
