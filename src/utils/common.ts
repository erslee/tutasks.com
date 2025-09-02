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

/**
 * Determines if a given ID appears to be a Google Sheets ID based on its format.
 * Google Sheets IDs are typically:
 * - Long (>30 characters)
 * - Alphanumeric with underscores only
 * - No hyphens or exclamation marks (which are common in Excel file IDs)
 * 
 * @param id The spreadsheet ID to check
 * @returns true if the ID appears to be a Google Sheets ID
 */
export function isGoogleSheetsId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  const MIN_GOOGLE_SHEETS_ID_LENGTH = 30;
  const GOOGLE_SHEETS_ID_PATTERN = /^[a-zA-Z0-9_]+$/;
  
  return (
    id.length > MIN_GOOGLE_SHEETS_ID_LENGTH &&
    !id.includes('!') &&
    !id.includes('-') &&
    GOOGLE_SHEETS_ID_PATTERN.test(id)
  );
}