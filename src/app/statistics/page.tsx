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
    <div style={{ background: '#232428', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', padding: 0 }}>
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
      <h2 style={{ fontWeight: 500, fontSize: 28, margin: '32px 0 16px 32px', color: '#e0e0e0' }}>Statistics</h2>
      <div style={{ margin: '0 16px', background: '#18191c', borderRadius: 8, padding: 24, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e0e0e0' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Task</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Sub Tasks</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([number, group]) => (
              group.map((task, idx) => (
                <tr key={task.uid || task.id || idx} style={{ borderBottom: '1px solid #333' }}>
                  {idx === 0 && (
                    <td rowSpan={group.length} style={{ verticalAlign: 'top', fontWeight: 600, padding: 8 }}>{number} <span role="img" aria-label="calendar">📋</span></td>
                  )}
                  <td style={{ padding: 8 }}>{task.description || '-'}</td>
                  <td style={{ padding: 8 }}>{task.date}</td>
                  {idx === 0 && (
                    <td rowSpan={group.length} style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>
                      {group.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0)}
                    </td>
                  )}
                </tr>
              ))
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, padding: 8 }}>Total Time</td>
              <td style={{ textAlign: 'right', fontWeight: 700, padding: 8 }}>{totalTime}</td>
            </tr>
          </tfoot>
        </table>
        {loading && <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>Loading...</div>}
        {error && <div style={{ color: '#e74c3c', fontSize: 18, marginTop: 32 }}>{error}</div>}
      </div>
    </div>
  );
} 
