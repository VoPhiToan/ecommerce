import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      isLoggedIn:  false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isLoggedIn: false });
      },

      isAdmin:    () => get().user?.role === 'admin',
      isStaff:    () => get().user?.role === 'staff',
      isCustomer: () => get().user?.role === 'customer',
    }),
    {
      name:    'auth-storage',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);

export default useAuthStore;