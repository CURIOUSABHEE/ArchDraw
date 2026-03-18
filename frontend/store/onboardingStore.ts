import { create } from 'zustand';

interface OnboardingStore {
  isOpen: boolean;
  currentStep: number;   // 0-indexed
  stepCompleted: boolean;
  open: () => void;
  close: () => void;
  nextStep: (totalSteps: number) => void;
  skip: () => void;
  setStepCompleted: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  isOpen: false,
  currentStep: 0,
  stepCompleted: false,

  open: () => set({ isOpen: true, currentStep: 0, stepCompleted: false }),

  close: () => set({ isOpen: false }),

  nextStep: (totalSteps: number) => {
    const { currentStep } = get();
    if (currentStep === totalSteps - 1) {
      localStorage.setItem('archdraw_guide_dismissed', 'true');
      set({ isOpen: false, stepCompleted: false });
    } else {
      set({ currentStep: currentStep + 1, stepCompleted: false });
    }
  },

  skip: () => {
    localStorage.setItem('archdraw_guide_dismissed', 'true');
    set({ isOpen: false, stepCompleted: false });
  },

  setStepCompleted: (v: boolean) => set({ stepCompleted: v }),
}));
