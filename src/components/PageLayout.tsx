import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import HeaderBar from "./HeaderBar";
import SheetModal from "./SheetModal";
import CalendarNav from "./CalendarNav";
import type { Task } from "../types/task";
import { getYears, months, getYearStats, getMonthStats, getDayStats } from "../utils/calendar";

interface PageLayoutProps {
  children: React.ReactNode;
  allTasks: Task[];
  sheetName: string | null;
  showSheetModal: boolean;
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  onSheetClick: (e: React.MouseEvent) => void;
  onSheetSelect: (sheet: { id: string; name: string }) => void;
  onCloseSheetModal: () => void;
  onYearSelect: (year: number) => void;
  onMonthSelect: (month: number) => void;
  onDaySelect: (day: number) => void;
  onToday: () => void;
  onImportSuccess?: () => void;
  hideDay?: boolean;
}

export default function PageLayout({
  children,
  allTasks,
  sheetName,
  showSheetModal,
  selectedYear,
  selectedMonth,
  selectedDay,
  onSheetClick,
  onSheetSelect,
  onCloseSheetModal,
  onYearSelect,
  onMonthSelect,
  onDaySelect,
  onToday,
  onImportSuccess,
  hideDay = false,
}: PageLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const years = getYears(allTasks);

  return (
    <div className="bg-[#323438] min-h-screen text-[#e0e0e0] font-sans p-0">
      <HeaderBar
        session={session}
        sheetName={sheetName}
        onSheetClick={onSheetClick}
        onSignOut={e => { e.stopPropagation(); router.push("/api/auth/signout"); }}
        onImportSuccess={onImportSuccess || (() => {})}
      />
      <SheetModal
        open={showSheetModal}
        onClose={onCloseSheetModal}
        onSelectSheet={onSheetSelect}
      />
      <CalendarNav
        years={years}
        months={months}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        onYearSelect={onYearSelect}
        onMonthSelect={onMonthSelect}
        onDaySelect={onDaySelect}
        handleToday={onToday}
        getYearStats={(year) => getYearStats(allTasks, year)}
        getMonthStats={(year, month) => getMonthStats(allTasks, year, month)}
        getDayStats={(year, month, day) => getDayStats(allTasks, year, month, day)}
        hideDay={hideDay}
      />
      {children}
    </div>
  );
}