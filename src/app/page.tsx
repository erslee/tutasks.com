"use client";
import { useEffect, useState } from "react";
import TaskTracker from "../components/TaskTracker";
import SheetSelector from "../components/SheetSelector";
import { useSession, signIn, signOut } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    setSelectedSheetId(localStorage.getItem("selectedSheetId"));
    setChecked(true);
  }, []);

  // Show spinner when switching sheets
  useEffect(() => {
    if (!checked) return;
    setSheetLoading(true);
    const timeout = setTimeout(() => setSheetLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [selectedSheetId, checked]);

  // Redirect to login if session has error (token refresh failed)
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError" && session?.user) {
      signOut({ callbackUrl: "/" });
    }
  }, [session]);

  if (status === "loading" || !checked) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300 text-2xl">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-400">TuTasks</h1>
        <p className="text-xl text-gray-300 text-center max-w-2xl mb-8">
          TuTasks is a powerful and intuitive task management application that seamlessly integrates with Google Sheets. Organize your tasks, track your progress, and collaborate with ease, all powered by the flexibility of your own spreadsheets.
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mb-6"
        >
          Sign in with Google to Get Started
        </button>
        <a
          href="https://github.com/erslee/tutasks.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-lg font-medium transition duration-300 ease-in-out"
        >
          Explore on GitHub
        </a>
      </div>
    );
  }

  if (selectedSheetId) {
    if (sheetLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300 text-2xl">Loading sheet...</div>;
    }
    return <TaskTracker key={selectedSheetId} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-12 min-w-[400px] flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-3 text-white">Select or Create a Sheet</h1>
        <p className="text-lg text-gray-400 mb-8 text-center">Choose where your tasks will be stored</p>
        <SheetSelector onSelectSheet={() => setSelectedSheetId(localStorage.getItem("selectedSheetId"))} />
        <button onClick={() => signOut()} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md">
          Sign Out
        </button>
      </div>
    </div>
  );
}
