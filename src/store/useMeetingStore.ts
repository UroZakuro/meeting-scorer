import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MeetingResult } from "../types";

type MeetingStore = {
  history: MeetingResult[];
  addResult: (result: MeetingResult) => void;
  removeResult: (id: string) => void;
  clearHistory: () => void;
};

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set) => ({
      history: [],
      addResult: (result) =>
        set((state) => ({ history: [result, ...state.history] })),
      removeResult: (id) =>
        set((state) => ({ history: state.history.filter((r) => r.id !== id) })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "meeting-scorer-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
