import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  total: 0,

  // items từ API có field unitPrice (không phải price)
  setCart: (items = []) => {
    const total = items.reduce(
      (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 0),
      0
    );
    set({ items, total });
  },

  clearCart: () => set({ items: [], total: 0 }),
}));

export default useCartStore;