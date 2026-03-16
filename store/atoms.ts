import { atom } from "jotai";

// Current active room ID
export const currentRoomIdAtom = atom<string | null>(null);

// Task filter for the dashboard
export type TaskFilter = "all" | "unassigned" | "mine";
export const taskFilterAtom = atom<TaskFilter>("all");
