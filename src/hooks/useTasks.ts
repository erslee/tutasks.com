import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types/task";
import { apiClient } from "../lib/api-client";

export function useTasks(selectedSheetId: string | null) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const fetchAllTasks = useCallback(async () => {
    if (!selectedSheetId) return;

    setLoadingTasks(true);
    setTasksError(null);

    try {
      const data = await apiClient.getAllTasks(selectedSheetId);
      setAllTasks(data.tasks || []);
    } catch (err: unknown) {
      setTasksError(
        err instanceof Error ? err.message : "Failed to load tasks",
      );
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedSheetId]);

  useEffect(() => {
    if (selectedSheetId) {
      fetchAllTasks();
    }
  }, [selectedSheetId, fetchAllTasks]);

  return {
    allTasks,
    loadingTasks,
    tasksError,
    fetchAllTasks,
    setAllTasks,
  };
}
