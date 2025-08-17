"use client";
import { useState, useEffect } from "react";
import PageLayout from "./PageLayout";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import { useCalendar } from "../hooks/useCalendar";
import { useSheetManager } from "../hooks/useSheetManager";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types/task";
import { generateUID, formatDate, getMonthSheetName } from "../utils/common";
import { apiClient } from "../lib/api-client";

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
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

  const calendar = useCalendar();
  const sheetManager = useSheetManager("/");
  const { allTasks, loadingTasks, tasksError, fetchAllTasks } = useTasks(sheetManager.selectedSheetId);

  // Prefill date field when selected day changes
  useEffect(() => {
    setDate(formatDate(calendar.selectedYear, calendar.selectedMonth, calendar.selectedDay));
  }, [calendar.selectedYear, calendar.selectedMonth, calendar.selectedDay]);

  async function handleAdd() {
    if (!number.trim() || !description.trim() || !date.trim() || !time.trim()) return;
    setAdding(true);
    setAddError(null);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) {
      setAddError("No sheet selected");
      setAdding(false);
      return;
    }
    const monthSheetName = getMonthSheetName(calendar.selectedYear, calendar.selectedMonth);
    const uid = generateUID();
    try {
      await apiClient.addTask({
        sheetId,
        monthSheetName,
        number,
        description,
        date,
        time,
        uid,
      });
      setNumber("");
      setDescription("");
      setDate("");
      setTime("");
      fetchAllTasks(); // Refetch all tasks
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(uid: string) {
    if (!uid) return;
    setDeletingUid(uid);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) {
      setDeletingUid(null);
      return;
    }
    const monthSheetName = `${getMonthSheetName(calendar.selectedYear, calendar.selectedMonth)}`;
    try {
      await apiClient.deleteTask({ sheetId, monthSheetName, uid });
      fetchAllTasks(); // Refetch all tasks
    } catch (err: unknown) {
      // Optionally show error
      console.error("Delete task error:", err);
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
    if (!sheetId) {
      setUpdateError("No sheet or month selected");
      setUpdating(false);
      return;
    }
    const monthSheetName = `${getMonthSheetName(calendar.selectedYear, calendar.selectedMonth)}`;
    try {
      await apiClient.updateTask({
        sheetId,
        monthSheetName,
        uid: editTask.uid,
        number,
        description,
        date,
        time,
      });
      setEditTask(null);
      setNumber("");
      setDescription("");
      setDate("");
      setTime("");
      fetchAllTasks(); // Refetch all tasks
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : String(err));
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
  if (calendar.selectedYear !== null && calendar.selectedMonth !== null && calendar.selectedDay !== null) {
    visibleTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === calendar.selectedYear && d.getMonth() === calendar.selectedMonth && d.getDate() === calendar.selectedDay;
    });
  }



  useEffect(() => {
    const monthTasks = allTasks.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === calendar.selectedYear && d.getMonth() === calendar.selectedMonth;
    });
    setTasks(monthTasks);
  }, [allTasks, calendar.selectedYear, calendar.selectedMonth]);

  useEffect(() => {
    function handlePasteShortcut(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (calendar.selectedYear !== null && calendar.selectedMonth !== null && calendar.selectedDay !== null) {
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
  }, [calendar.selectedYear, calendar.selectedMonth, calendar.selectedDay]);



  // Handlers for TaskList
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
    <PageLayout
      allTasks={allTasks}
      sheetName={sheetManager.sheetName}
      showSheetModal={sheetManager.showSheetModal}
      selectedYear={calendar.selectedYear}
      selectedMonth={calendar.selectedMonth}
      selectedDay={calendar.selectedDay}
      onSheetClick={e => { e.stopPropagation(); sheetManager.openSheetModal(); }}
      onSheetSelect={sheetManager.handleSheetChange}
      onCloseSheetModal={sheetManager.closeSheetModal}
      onYearSelect={calendar.handleYearSelect}
      onMonthSelect={calendar.handleMonthSelect}
      onDaySelect={calendar.handleDaySelect}
      onToday={calendar.handleToday}
      onImportSuccess={fetchAllTasks}
    >
      <section className="mx-8 mb-6">
        <h2 className="font-medium text-2xl mt-8 mb-4 text-gray-200">Task List</h2>
        <TaskList
          tasks={visibleTasks}
          loading={loadingTasks}
          error={tasksError}
          onTaskClick={handleTaskClick}
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
    </PageLayout>
  );
} 
