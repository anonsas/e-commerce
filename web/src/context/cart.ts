import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  productId: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  handleAddItem: (productId: string, quantity?: number) => void;
  handleRemoveItem: (productId: string) => void;
  handleSetQuantity: (productId: string, quantity: number) => void;
  handleClearCart: () => void;
};

// Cart is persisted to localStorage so it survives page refreshes.
export const useCartContext = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      handleAddItem(productId, quantity = 1) {
        const items = [...get().items];
        const existingIndex = items.findIndex((item) => item.productId === productId);
        if (existingIndex >= 0) {
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + quantity,
          };
        } else {
          items.push({ productId, quantity });
        }
        set({ items });
      },

      handleRemoveItem(productId) {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },

      handleSetQuantity(productId, quantity) {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        });
      },

      handleClearCart() {
        set({ items: [] });
      },
    }),
    { name: "igorlukjanov-cart" },
  ),
);
