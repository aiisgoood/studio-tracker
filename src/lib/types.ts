export type Priority = "low" | "medium" | "urgent";
export type Status = "todo" | "doing" | "done";

export interface Member {
  id: string;
  name: string;
  /** Single uppercase initial shown in the avatar. */
  initial: string;
  /** Avatar background color. */
  color: string;
  /** Avatar text color (initial). */
  ink: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  /** Empty array = "up for grabs" (unassigned, anyone can claim). */
  assigneeIds: string[];
  /** ISO date string (YYYY-MM-DD) or undefined for no date. */
  dueDate?: string;
  /** uploaded image URLs attached to the task */
  imageUrls?: string[];
  /** member id of whoever created the task */
  createdBy?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  /** Exactly one of taskId / ideaId is set — a comment hangs off one parent. */
  taskId?: string;
  ideaId?: string;
  authorId: string;
  body?: string;
  imageUrl?: string;
  createdAt: string;
}

/** Where a comment thread lives: on a task card or on an idea. */
export type CommentTarget =
  | { kind: "task"; id: string }
  | { kind: "idea"; id: string };

export const STATUSES: { id: Status; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "urgent", label: "Urgent" },
];

export type IdeaStatus = "new" | "exploring" | "building" | "parked";

/** A competitor / similar product noted on an idea. */
export interface Competitor {
  name: string;
  url?: string;
  note?: string;
}

export interface Idea {
  id: string;
  title: string;
  /** one-line pitch */
  pitch?: string;
  /** longer free-form write-up */
  description?: string;
  /** competitors / prior art to be aware of */
  competitors: Competitor[];
  /** free-form labels, e.g. "saas", "moonshot" */
  tags: string[];
  /** uploaded reference image URLs */
  imageUrls: string[];
  suggestedById: string;
  status: IdeaStatus;
  /** member ids who upvoted */
  votes: string[];
  createdAt: string;
  /** last time the idea's content was edited */
  updatedAt?: string;
}

export const IDEA_STATUSES: { id: IdeaStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "exploring", label: "Exploring" },
  { id: "building", label: "Building" },
  { id: "parked", label: "Parked" },
];
