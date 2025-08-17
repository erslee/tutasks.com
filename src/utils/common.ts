export function generateUID() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDate(year: number, month: number, day: number): string {
  const yyyy = year;
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getMonthSheetName(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}