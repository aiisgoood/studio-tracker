"use client";

import { CommentTarget } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Comments } from "./Comments";

export function CommentsDialog({
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
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate pr-6">Comments · {title}</DialogTitle>
            </DialogHeader>
            <Comments target={target} currentUserId={currentUserId} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
