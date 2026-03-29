import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Current active room ID
export const currentRoomIdAtom = atomWithStorage<string | null>("roomietasks_current_room_id", null);

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

// Push notification prompt — persisted so it only shows once
export const pushPromptDismissedAtom = atomWithStorage<boolean>("roomietasks_push_prompt_dismissed", false);
