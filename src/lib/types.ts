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
  taskId: string;
  authorId: string;
  body?: string;
  imageUrl?: string;
  createdAt: string;
}

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

export interface Idea {
  id: string;
  title: string;
  pitch?: string;
  suggestedById: string;
  status: IdeaStatus;
  /** member ids who upvoted */
  votes: string[];
  createdAt: string;
}

export const IDEA_STATUSES: { id: IdeaStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "exploring", label: "Exploring" },
  { id: "building", label: "Building" },
  { id: "parked", label: "Parked" },
];
