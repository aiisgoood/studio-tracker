"use client";

import { Task } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Comments } from "./Comments";

export function CommentsDialog({
  task,
  currentUserId,
  onClose,
}: {
  task: Task | null;
  currentUserId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {task && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate pr-6">
                Comments · {task.title}
              </DialogTitle>
            </DialogHeader>
            <Comments taskId={task.id} currentUserId={currentUserId} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
