import type { Task } from "../types/task";

// Get unique years from tasks data plus current year
export const getYears = (tasks: Task[]) => {
  const yearsWithData = tasks.map(t => new Date(t.date).getFullYear());
  return Array.from(
    new Set([
      ...yearsWithData,
      new Date().getFullYear()
    ])
  ).sort((a, b) => a - b);
};

export const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Statistics calculation helpers
export function getYearStats(allTasks: Task[], year: number) {
  const filtered = allTasks.filter(t => new Date(t.date).getFullYear() === year);
  return {
    count: filtered.length,
    hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
  };
}

export function getMonthStats(allTasks: Task[], year: number, month: number) {
  const filtered = allTasks.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  return {
    count: filtered.length,
    hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
  };
}

export function getDayStats(allTasks: Task[], year: number, month: number, day: number) {
  const filtered = allTasks.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
  return {
    count: filtered.length,
    hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
  };
}