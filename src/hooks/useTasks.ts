import { useState, useEffect } from "react";
import type { Task } from "../types/task";

export function useTasks(selectedSheetId: string | null) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const fetchAllTasks = async () => {
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) return;

    setLoadingTasks(true);
    setTasksError(null);

    try {
      const res = await fetch(`/api/sheets/get-all-tasks?sheetId=${encodeURIComponent(sheetId)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAllTasks(data.tasks || []);
    } catch (err: unknown) {
      setTasksError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (selectedSheetId) {
      fetchAllTasks();
    }
  }, [selectedSheetId]);

  return {
    allTasks,
    loadingTasks,
    tasksError,
    fetchAllTasks,
    setAllTasks,
  };
}