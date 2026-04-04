import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalState {
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  toggleProfile: () => void;
}

export const useModalStore = create<ModalState>()(
  persist(
    (set) => ({
      isProfileOpen: false,
      openProfile: () => set({ isProfileOpen: true }),
      closeProfile: () => set({ isProfileOpen: false }),
      toggleProfile: () => set((state) => ({ isProfileOpen: !state.isProfileOpen })),
    }),
    {
      name: 'modal-storage',
      partialize: () => ({}),
    }
  )
);
