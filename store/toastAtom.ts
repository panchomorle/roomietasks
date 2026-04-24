import { atom } from "jotai";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export const toastsAtom = atom<ToastMessage[]>([]);

export const addToastAtom = atom(
  null,
  (get, set, update: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    set(toastsAtom, (prev) => [...prev, { ...update, id }]);
    setTimeout(() => {
      set(removeToastAtom, id);
    }, 3000);
  }
);

export const removeToastAtom = atom(
  null,
  (get, set, id: string) => {
    set(toastsAtom, (prev) => prev.filter((t) => t.id !== id));
  }
);
