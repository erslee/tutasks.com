"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRef } from "react";

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

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function generateUID() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Today logic
  const today = new Date();
  // Calendar state (default to today)
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const handleToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  // Prefill date field when selected day changes
  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      const yyyy = selectedYear;
      const mm = String(selectedMonth + 1).padStart(2, '0');
      const dd = String(selectedDay).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Aggregation helpers
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
  function getDayStats(year: number, month: number, day: number) {
    const filtered = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    return {
      count: filtered.length,
      hours: filtered.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0),
    };
  }

  async function handleAdd() {
    if (!number.trim() || !description.trim() || !date.trim() || !time.trim()) return;
    setAdding(true);
    setAddError(null);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId || selectedYear === null || selectedMonth === null) {
      setAddError("No sheet or month selected");
      setAdding(false);
      return;
    }
    const monthSheetName = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const uid = generateUID();
    try {
      const res = await fetch("/api/sheets/add-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          monthSheetName,
          number,
          description,
          date,
          time,
          uid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add task");
      setNumber("");
      setDescription("");
      setDate("");
      setTime("");
      // Refresh tasks
      setLoadingTasks(true);
      setTasksError(null);
      fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setTasks(data.tasks || []);
        })
        .catch(err => setTasksError(err.message || "Failed to load tasks"))
        .finally(() => setLoadingTasks(false));
    } catch (err: any) {
      setAddError(err.message || "Failed to add task");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(uid: string) {
    if (!uid) return;
    setDeletingUid(uid);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId || selectedYear === null || selectedMonth === null) {
      setDeletingUid(null);
      return;
    }
    const monthSheetName = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    try {
      const res = await fetch("/api/sheets/delete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, monthSheetName, uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete task");
      // Refresh tasks
      setLoadingTasks(true);
      setTasksError(null);
      fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setTasks(data.tasks || []);
        })
        .catch(err => setTasksError(err.message || "Failed to load tasks"))
        .finally(() => setLoadingTasks(false));
    } catch (err) {
      // Optionally show error
    } finally {
      setDeletingUid(null);
    }
  }

  // Handle task card click for editing
  function handleTaskClick(task: Task) {
    setEditTask(task);
    setNumber(task.number);
    setDescription(task.description);
    setDate(task.date);
    setTime(task.time);
  }

  // Handle update
  async function handleUpdate() {
    if (!editTask || !editTask.uid) return;
    setUpdating(true);
    setUpdateError(null);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId || selectedYear === null || selectedMonth === null) {
      setUpdateError("No sheet or month selected");
      setUpdating(false);
      return;
    }
    const monthSheetName = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    try {
      const res = await fetch("/api/sheets/update-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          monthSheetName,
          uid: editTask.uid,
          number,
          description,
          date,
          time,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update task");
      setEditTask(null);
      setNumber("");
      setDescription("");
      setDate("");
      setTime("");
      // Refresh tasks
      setLoadingTasks(true);
      setTasksError(null);
      fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setTasks(data.tasks || []);
        })
        .catch(err => setTasksError(err.message || "Failed to load tasks"))
        .finally(() => setLoadingTasks(false));
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  }

  function handleCancelEdit() {
    setEditTask(null);
    setNumber("");
    setDescription("");
    setDate("");
    setTime("");
    setUpdateError(null);
  }

  // Filter tasks for selected day
  let visibleTasks: Task[] = [];
  if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
    visibleTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay;
    });
  }

  // Fetch tasks for selected month and sheet
  useEffect(() => {
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId || selectedYear === null || selectedMonth === null) return;
    const monthSheetName = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    setLoadingTasks(true);
    setTasksError(null);
    fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setTasks(data.tasks || []);
      })
      .catch(err => setTasksError(err.message || "Failed to load tasks"))
      .finally(() => setLoadingTasks(false));
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    function handlePasteShortcut(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
          navigator.clipboard.readText().then(text => {
            // Only match if pattern is {text} - {text} and both sides are non-empty
            const match = text.match(/^(^[\w\d\-]+)\s-\s(.+)/);
            if (match) {
              e.preventDefault();
              setNumber(match[1].trim());
              setDescription(match[2].trim());
            }
          });
        }
      }
    }
    window.addEventListener('keydown', handlePasteShortcut);
    return () => window.removeEventListener('keydown', handlePasteShortcut);
  }, [selectedYear, selectedMonth, selectedDay]);

  const { data: session } = useSession();
  // Get selected sheet name from localStorage
  const [sheetName, setSheetName] = useState<string | null>(null);
  useEffect(() => {
    setSheetName(localStorage.getItem("selectedSheetName"));
  }, []);

  // Copy task number and description to clipboard
  function handleCopy(task: Task) {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const text = `${task.number} - ${task.description}`;
      navigator.clipboard.writeText(text);
    }
  }

  // Calendar UI
  return (
    <div style={{ background: '#323438', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', padding: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', fontSize: 32, fontWeight: 600 }}>
        <span>Tu Tasks</span>
        <div style={{ flex: 1 }} />
        <a href="#" style={{ color: '#b0b0b0', marginRight: 16, textDecoration: 'underline', fontSize: 16 }}>Statistic</a>
        <button
          onClick={() => signOut()}
          style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          {session?.user?.image && (
            <img src={session.user.image} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
          )}
          {session?.user?.name && (
            <span style={{ fontSize: 16, fontWeight: 400 }}>
              {session.user.name}
              {sheetName && <span style={{ color: '#b0b0b0', fontWeight: 400, marginLeft: 8 }}>[{sheetName}]</span>}
            </span>
          )}
          <span style={{ fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Sign Out</span>
        </button>
      </header>
      <section style={{ background: '#232428', borderRadius: 8, margin: '0 16px', padding: 16, marginBottom: 24 }}>
        {/* Calendar Navigation */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 16, marginBottom: 8, whiteSpace: 'nowrap' }}>
          {years.map(y => {
            const stats = getYearStats(y);
            return (
              <div
                key={y}
                onClick={() => { setSelectedYear(y); setSelectedMonth(0); setSelectedDay(1); }}
                style={{
                  background: selectedYear === y ? '#44474e' : '#323438',
                  borderRadius: 6,
                  padding: '8px 24px',
                  fontWeight: 600,
                  fontSize: 18,
                  color: selectedYear === y ? '#fff' : '#b0b0b0',
                  cursor: 'pointer',
                  border: selectedYear === y ? '2px solid #3bb0d6' : 'none',
                  transition: 'all 0.15s',
                  minWidth: 90,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                {y} <span style={{ color: '#b0b0b0', fontWeight: 400, fontSize: 15 }}> {stats.count} ({stats.hours})</span>
              </div>
            );
          })}
          <div
            onClick={handleToday}
            style={{
              background: '#3bb0d6',
              borderRadius: 6,
              padding: '8px 24px',
              fontWeight: 600,
              fontSize: 18,
              color: '#fff',
              cursor: 'pointer',
              minWidth: 90,
              textAlign: 'center',
              userSelect: 'none',
              marginLeft: 12,
              boxShadow: '0 2px 8px 0 rgba(59,176,214,0.10)'
            }}
          >
            Today
          </div>
        </div>
        {selectedYear !== null && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 8, whiteSpace: 'nowrap' }}>
            {months.map((m, i) => {
              const stats = getMonthStats(selectedYear, i);
              return (
                <div
                  key={m}
                  onClick={() => { setSelectedMonth(i); setSelectedDay(1); }}
                  style={{
                    background: selectedMonth === i ? '#44474e' : '#232428',
                    borderRadius: 4,
                    padding: '4px 16px',
                    fontWeight: 500,
                    fontSize: 15,
                    color: selectedMonth === i ? '#fff' : '#b0b0b0',
                    border: selectedMonth === i ? '2px solid #3bb0d6' : '1px solid #44474e',
                    margin: '0 1px',
                    cursor: 'pointer',
                    minWidth: 70,
                    textAlign: 'center',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {m}<br /><span style={{ fontSize: 12, color: '#888' }}>{stats.count} ({stats.hours})</span>
                </div>
              );
            })}
          </div>
        )}
        {selectedYear !== null && selectedMonth !== null && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2, whiteSpace: 'nowrap' }}>
            {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
              const day = i + 1;
              const dateObj = new Date(selectedYear, selectedMonth, day);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const stats = getDayStats(selectedYear, selectedMonth, day);
              return (
                <div
                  key={`${selectedYear}-${selectedMonth}-${day}`}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    background: selectedDay === day
                      ? '#44474e'
                      : isWeekend
                        ? '#55585e'
                        : '#323438',
                    color: selectedDay === day
                      ? '#fff'
                      : isWeekend
                        ? '#b0b0b0'
                        : '#e0e0e0',
                    borderRadius: 3,
                    padding: '4px 8px',
                    fontWeight: 500,
                    fontSize: 15,
                    border: selectedDay === day ? '2px solid #3bb0d6' : '1px solid #44474e',
                    margin: '0 1px',
                    cursor: 'pointer',
                    minWidth: 40,
                    textAlign: 'center',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{day}</span>
                  <span style={{ fontSize: 11, color: '#b0b0b0', marginTop: 2, lineHeight: 1 }}>{stats.count} <span style={{ color: '#888' }}>({stats.hours})</span></span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section style={{ margin: '0 32px', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 500, fontSize: 26, margin: '32px 0 16px 0', color: '#e0e0e0' }}>Task List</h2>
        {loadingTasks && <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>Loading tasks...</div>}
        {tasksError && <div style={{ color: '#e74c3c', fontSize: 18, marginTop: 32 }}>{tasksError}</div>}
        {selectedYear !== null && selectedMonth !== null && selectedDay !== null ? (
          visibleTasks.length > 0 ? (
            visibleTasks.map((task, idx) => {
              let key: string | undefined = undefined;
              if (typeof task.uid === 'string' && task.uid.length > 0) key = task.uid;
              else if (typeof task.id === 'string' && task.id.length > 0) key = task.id;
              return (
                <div key={key || ('' + idx)} style={{
                background: '#393b40',
                borderRadius: 8,
                padding: '18px 24px 12px 24px',
                marginBottom: 18,
                border: '1px solid #232428',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                cursor: 'pointer',
              }} onClick={() => handleTaskClick(task)}>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 8 }}>
                  {task.description}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 15,
                  color: '#b0b0b0',
                  gap: 32,
                  marginBottom: 0,
                  marginTop: 8,
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <span>Task Number: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.number} <span role="img" aria-label="calendar">📅</span></span></span>
                    <span>Created at: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.date}</span></span>
                    <span>time: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.time}</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleCopy(task);
                          const button = e.target as HTMLButtonElement;
                          button.textContent = 'Copied!';
                          setTimeout(() => {
                            button.textContent = '📋';
                          }, 1000);
                        }}
                    >
                      <span role="img" aria-label="copy">📋</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(task.uid || ''); }}
                      disabled={deletingUid === task.uid}
                      style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, opacity: deletingUid === task.uid ? 0.6 : 1 }}
                    >
                      {deletingUid === task.uid ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>No tasks for this day.</div>
          )
        ) : (
          <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>Select a day to view tasks.</div>
        )}
      </section>
      <footer style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', background: '#232428', padding: 16, display: 'flex', gap: 12, alignItems: 'center', zIndex: 10 }}>
        <input placeholder="Task Number" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={number} onChange={e => setNumber(e.target.value)} />
        <input placeholder="Task" style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" style={{ flex: '0 0 160px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={date} onChange={e => setDate(e.target.value)} />
        <input placeholder="Time" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={time} onChange={e => setTime(e.target.value)} />
        {editTask ? (
          <button style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={handleUpdate} disabled={updating || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{updating ? 'Updating...' : 'Update'}</button>
        ) : (
          <button style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={handleAdd} disabled={adding || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{adding ? 'Adding...' : 'Add'}</button>
        )}
        <button style={{ background: '#666a70', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={editTask ? handleCancelEdit : () => { setNumber(""); setDescription(""); setDate(""); setTime(""); }}>{editTask ? 'Cancel' : 'Cancel'}</button>
        {addError && <span style={{ color: '#e74c3c', marginLeft: 16 }}>{addError}</span>}
        {updateError && <span style={{ color: '#e74c3c', marginLeft: 16 }}>{updateError}</span>}
      </footer>
    </div>
  );
} 
