"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TaskTracker from "../TaskTracker";

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    const selectedSheetId = localStorage.getItem("selectedSheetId");
    if (!selectedSheetId) {
      router.replace("/select-sheet");
    }
  }, [router]);

  // Optionally, you could show a loading spinner while checking
  return <TaskTracker />;
} 
