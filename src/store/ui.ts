import { create } from "zustand";

export type Panel = "shipping" | "returns" | "faq" | "size-guide" | "about" | "contact";

interface UIState {
  menuOpen: boolean;
  cartOpen: boolean;
  activePanel: Panel | null;
  setMenuOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
}

/** Global UI chrome state (menu, cart drawer, info panels). Cart contents live in their own store. */
export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  cartOpen: false,
  activePanel: null,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  openPanel: (activePanel) => set({ activePanel }),
  closePanel: () => set({ activePanel: null }),
}));
