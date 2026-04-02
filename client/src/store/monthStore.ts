import { create } from 'zustand';

interface MonthState {
  month: number;
  year: number;
  prev: () => void;
  next: () => void;
  setToday: () => void;
}

const now = new Date();

export const useMonthStore = create<MonthState>((set, get) => ({
  month: now.getMonth() + 1,
  year:  now.getFullYear(),

  prev: () => {
    const { month, year } = get();
    if (month === 1) set({ month: 12, year: year - 1 });
    else             set({ month: month - 1 });
  },

  next: () => {
    const { month, year } = get();
    if (month === 12) set({ month: 1, year: year + 1 });
    else              set({ month: month + 1 });
  },

  setToday: () => {
    const d = new Date();
    set({ month: d.getMonth() + 1, year: d.getFullYear() });
  },
}));
