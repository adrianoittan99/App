import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  tone: "error" | "success" | "info";
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

// A plain (non-persisted) store, callable from anywhere — including
// store.ts, which isn't a React component — the same way useAppStore is.
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 6000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Call from anywhere non-React (store.ts) when a remote write fails. */
export function notifyError(message = "Couldn't save that — check your connection and try again.") {
  useToastStore.getState().push({ message, tone: "error" });
}

export function notifyUndo(message: string, onUndo: () => void) {
  useToastStore.getState().push({ message, tone: "info", action: { label: "Undo", onClick: onUndo } });
}
