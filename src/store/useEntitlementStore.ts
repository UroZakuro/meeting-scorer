import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FREE_MONTHLY_EVALUATIONS,
  FREE_MAX_HISTORY,
} from "../lib/constants";

type EntitlementStore = {
  isPremium: boolean;
  monthlyEvaluationCount: number;
  countResetDate: string; // YYYY-MM-DD

  // アクション
  setPremium: (value: boolean) => void;
  incrementEvaluationCount: () => void;
  canEvaluate: () => boolean;
  canSaveHistory: (currentHistoryLength: number) => boolean;
  resetCountIfNeeded: () => void;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export const useEntitlementStore = create<EntitlementStore>()(
  persist(
    (set, get) => ({
      isPremium: false,
      monthlyEvaluationCount: 0,
      countResetDate: firstOfMonthStr(),

      setPremium: (value) => set({ isPremium: value }),

      resetCountIfNeeded: () => {
        const currentReset = firstOfMonthStr();
        if (get().countResetDate !== currentReset) {
          set({ monthlyEvaluationCount: 0, countResetDate: currentReset });
        }
      },

      incrementEvaluationCount: () => {
        get().resetCountIfNeeded();
        set((s) => ({ monthlyEvaluationCount: s.monthlyEvaluationCount + 1 }));
      },

      canEvaluate: () => {
        const s = get();
        s.resetCountIfNeeded();
        if (s.isPremium) return true;
        return s.monthlyEvaluationCount < FREE_MONTHLY_EVALUATIONS;
      },

      canSaveHistory: (currentHistoryLength: number) => {
        const s = get();
        if (s.isPremium) return true;
        return currentHistoryLength < FREE_MAX_HISTORY;
      },
    }),
    {
      name: "meeting-scorer-entitlement",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
