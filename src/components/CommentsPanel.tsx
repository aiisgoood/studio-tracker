"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { CommentTarget } from "@/lib/types";
import { Comments } from "./Comments";

/**
 * Comments shown as a panel that slides in from the right edge, full height.
 */
export function CommentsPanel({
  target,
  title,
  currentUserId,
  onClose,
}: {
  /** null = closed */
  target: CommentTarget | null;
  title: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-popover p-4 text-sm text-popover-foreground shadow-2xl duration-200 outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right">
          {target && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-3">
                <DialogPrimitive.Title className="truncate text-base font-medium text-foreground">
                  Comments · {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Close"
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </DialogPrimitive.Close>
              </div>
              <div className="min-h-0 flex-1">
                <Comments target={target} currentUserId={currentUserId} />
              </div>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
