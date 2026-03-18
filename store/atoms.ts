import { atom } from "jotai";

// Current active room ID
export const currentRoomIdAtom = atom<string | null>(null);

// Task filter and sort for the dashboard
export type TaskFilter = "all" | "unassigned" | "mine";
export const taskFilterAtom = atom<TaskFilter>("all");

export type TaskSort = 
  | "due_date_asc" 
  | "due_date_desc" 
  | "points_desc" 
  | "points_asc" 
  | "title_asc" 
  | "created_at_desc";

export const taskSortAtom = atom<TaskSort>("due_date_asc");
