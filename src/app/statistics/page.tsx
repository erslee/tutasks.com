"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import HeaderBar from "../../components/HeaderBar";
import SheetModal from "../../components/SheetModal";
import CalendarNav from "../../components/CalendarNav";
import { useRouter } from "next/navigation";

interface Task {
  uid?: string;
  id?: string;
  number: string;
  description: string;
  date: string;
  time: string;
}

const years = [2023, 2024, 2025];
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function StatisticsPage() {
  const { data: session } = useSession();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const router = useRouter();

  // Calendar state (default to today)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  async function fetchAllTasks() {
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) return;

    setLoadingTasks(true);
    setTasksError(null);

    try {
      const res = await fetch(`/api/sheets/get-all-tasks?sheetId=${encodeURIComponent(sheetId)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAllTasks(data.tasks || []);
    } catch (err: any) {
      setTasksError(err.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }

  useEffect(() => {
    setSelectedSheetId(localStorage.getItem("selectedSheetId"));
    setSheetName(localStorage.getItem("selectedSheetName"));
  }, []);

  useEffect(() => {
    if (selectedSheetId) {
      fetchAllTasks();
    }
  }, [selectedSheetId]);

  function handleSheetChange(sheet: { id: string; name: string }) {
    localStorage.setItem("selectedSheetId", sheet.id);
    localStorage.setItem("selectedSheetName", sheet.name);
    setSheetName(sheet.name);
    setSelectedSheetId(sheet.id);
    setShowSheetModal(false);
    router.replace("/statistics"); // reloads with new sheet
  }

  // Aggregation helpers
  function getYearStats(year: number) {
    const filtered = allTasks.filter(t => new Date(t.date).getFullYear() === year);
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }
  function getMonthStats(year: number, month: number) {
    const filtered = allTasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }
  function getDayStats(year: number, month: number, day: number) {
    const filtered = allTasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(0);
    setSelectedDay(1);
  };
  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setSelectedDay(1);
  };
  const handleDaySelect = (day: number) => setSelectedDay(day);

  const handleToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const grouped = allTasks.reduce((acc: Record<string, Task[]>, task) => {

    const date = new Date(task.date);

    if (date.getFullYear() !== selectedYear || date.getMonth() !== selectedMonth) {
      return acc; // Skip tasks not in the selected year/month
    }

    const number = task.number || "0";
    if (!acc[number]) {
      acc[number] = [];
    }
    acc[number].push(task);
    return acc;
  }, {});

  const totalTime = Object.values(grouped).reduce((sum, group) => {
    return sum + group.reduce((groupSum, task) => groupSum + (parseFloat(task.time) || 0), 0);
  }, 0).toFixed(2);

  return (
    <div className="bg-[#323438] min-h-screen text-[#e0e0e0] font-sans p-0">
      <HeaderBar
        session={session}
        sheetName={sheetName}
        onSheetClick={e => { e.stopPropagation(); setShowSheetModal(true); }}
        onSignOut={e => { e.stopPropagation(); router.push("/api/auth/signout"); }}
        onImportSuccess={fetchAllTasks} // Refresh data after import
      />
      <SheetModal
        open={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        onSelectSheet={handleSheetChange}
      />
      <CalendarNav
        years={years}
        months={months}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        onYearSelect={handleYearSelect}
        onMonthSelect={handleMonthSelect}
        onDaySelect={handleDaySelect}
        handleToday={handleToday}
        getYearStats={getYearStats}
        getMonthStats={getMonthStats}
        getDayStats={getDayStats}
        hideDay={true}
      />
      <h2 className="font-medium text-2xl mt-8 mb-4 ml-8 text-[#e0e0e0]">Statistics</h2>
      <div className="mx-4 bg-[#18191c] rounded-lg p-6 shadow-xl">
        <table className="w-full border-collapse text-[#e0e0e0]">
          <thead>
            <tr className="border-b-2 border-[#444]">
              <th className="text-left p-2">Task</th>
              <th className="text-left p-2">Sub Tasks</th>
              <th className="text-left p-2">Date</th>
              <th className="text-right p-2">Total Time</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([number, group]) => (
              group.map((task, idx) => (
                <tr key={task.uid || task.id || idx} className="border-b border-[#333]">
                  {idx === 0 && (
                    <td rowSpan={group.length} className="align-top font-semibold p-2">{number} <span role="img" aria-label="calendar">📋</span></td>
                  )}
                  <td className="p-2">{task.description || '-'}</td>
                  <td className="p-2">{task.date}</td>
                  {idx === 0 && (
                    <td rowSpan={group.length} className="text-right font-semibold p-2">
                      {group.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0)}
                    </td>
                  )}
                </tr>
              ))
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold p-2">Total Time</td>
              <td className="text-right font-bold p-2">{totalTime}</td>
            </tr>
          </tfoot>
        </table>
        {loadingTasks && <div className="text-gray-400 text-lg mt-8">Loading...</div>}
        {tasksError && <div className="text-red-500 text-lg mt-8">{tasksError}</div>}
      </div>
    </div>
  );
}
