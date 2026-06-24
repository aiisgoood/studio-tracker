"use client";

import { motion } from "framer-motion";
import { MEMBERS } from "@/lib/data";
import { Avatar } from "./parts";

export function WhoAreYou({ onPick }: { onPick: (memberId: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Studio
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Who are you?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick your name to jump in. We&apos;ll remember you on this device.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-2.5">
          {MEMBERS.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              onClick={() => onPick(m.id)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
            >
              <Avatar member={m} size={38} />
              <span className="text-base font-medium capitalize text-ink">
                {m.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
