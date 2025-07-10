"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import CalendarNav from "../../components/CalendarNav";
import HeaderBar from "../../components/HeaderBar";

const years = [2023, 2024, 2025];
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);

  useEffect(() => {
    setSheetName(localStorage.getItem("selectedSheetName"));
  }, []);

  useEffect(() => {
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) return;
    const monthSheetName = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    setLoading(true);
    setError(null);
    fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setTasks(data.tasks || []);
      })
      .catch(err => setError(err.message || "Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  // Group tasks by number
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const t of tasks) {
      if (!map[t.number]) map[t.number] = [];
      map[t.number].push(t);
    }
    return map;
  }, [tasks]);

  const totalTime = useMemo(() => tasks.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0), [tasks]);

  function getYearStats(year: number) {
    const filtered = tasks.filter(t => new Date(t.date).getFullYear() === year);
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }
  function getMonthStats(year: number, month: number) {
    const filtered = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }
  function getDayStats() { return { count: 0, hours: 0 }; }

  return (
    <div className="bg-[#232428] min-h-screen text-[#e0e0e0] font-sans p-0">
      <HeaderBar
        session={session}
        sheetName={sheetName}
        onSheetClick={() => {}}
        onSignOut={() => signOut()}
      />
      <CalendarNav
        years={years}
        months={months}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={1}
        onYearSelect={y => { setSelectedYear(y); setSelectedMonth(0); }}
        onMonthSelect={m => setSelectedMonth(m)}
        onDaySelect={() => {}}
        handleToday={() => {
          setSelectedYear(today.getFullYear());
          setSelectedMonth(today.getMonth());
        }}
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
        {loading && <div className="text-gray-400 text-lg mt-8">Loading...</div>}
        {error && <div className="text-red-500 text-lg mt-8">{error}</div>}
      </div>
    </div>
  );
} 
