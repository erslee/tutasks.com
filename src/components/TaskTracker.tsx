"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRef } from "react";
import SheetSelector from "./SheetSelector";
import { useRouter } from "next/navigation";
import HeaderBar from "./HeaderBar";
import SheetModal from "./SheetModal";
import CalendarNav from "./CalendarNav";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";

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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
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
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);

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
      fetchAllTasks(); // Refetch all tasks
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
      fetchAllTasks(); // Refetch all tasks
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
      fetchAllTasks(); // Refetch all tasks
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

  useEffect(() => {
    setSelectedSheetId(localStorage.getItem("selectedSheetId"));
  }, []);

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
    const sheetId = localStorage.getItem("selectedSheetId");
    setSelectedSheetId(sheetId);
    if (sheetId) {
      fetchAllTasks();
    }
  }, [selectedSheetId]);

  useEffect(() => {
    const monthTasks = allTasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
    setTasks(monthTasks);
  }, [allTasks, selectedYear, selectedMonth]);

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
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSheetName(localStorage.getItem("selectedSheetName"));
  }, []);

  function handleSheetChange(sheet: { id: string; name: string }) {
    localStorage.setItem("selectedSheetId", sheet.id);
    localStorage.setItem("selectedSheetName", sheet.name);
    setSheetName(sheet.name);
    setSelectedSheetId(sheet.id);
    setShowSheetModal(false);
    router.replace("/"); // reloads with new sheet
  }

  // Copy task number and description to clipboard
  function handleCopy(task: Task) {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const text = `${task.number} - ${task.description}`;
      navigator.clipboard.writeText(text);
    }
  }



  function handleImportSuccess() {
    // Optionally refresh tasks
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
  }

  // Handlers for CalendarNav
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

  // Handlers for TaskList
  const handleTaskCopy = (task: Task, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleCopy(task);
    const button = e.target as HTMLButtonElement;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = '📋';
    }, 1000);
  };
  const handleTaskDelete = (task: Task, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleDelete(task.uid || '');
  };

  // Handlers for TaskForm
  const handleFormCancel = () => {
    if (editTask) handleCancelEdit();
    else {
      setNumber(""); setDescription(""); setDate(""); setTime("");
    }
  };

  return (
    <div className="bg-[#323438] min-h-screen text-[#e0e0e0] font-sans p-0">
      <HeaderBar
        session={session}
        sheetName={sheetName}
        onSheetClick={e => { e.stopPropagation(); setShowSheetModal(true); }}
        onSignOut={e => { e.stopPropagation(); signOut(); }}
        onImportSuccess={handleImportSuccess}
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
      />
      <section style={{ margin: '0 32px', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 500, fontSize: 26, margin: '32px 0 16px 0', color: '#e0e0e0' }}>Task List</h2>
        <TaskList
          tasks={visibleTasks}
          loading={loadingTasks}
          error={tasksError}
          onTaskClick={handleTaskClick}
          onCopy={handleTaskCopy}
          onDelete={handleTaskDelete}
          deletingUid={deletingUid}
        />
      </section>
      <TaskForm
        number={number}
        description={description}
        date={date}
        time={time}
        onNumberChange={e => setNumber(e.target.value)}
        onDescriptionChange={e => setDescription(e.target.value)}
        onDateChange={e => setDate(e.target.value)}
        onTimeChange={e => setTime(e.target.value)}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onCancel={handleFormCancel}
        editMode={!!editTask}
        loading={adding || updating}
        addError={addError}
        updateError={updateError}
      />
    </div>
  );
} 
