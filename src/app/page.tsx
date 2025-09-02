"use client";
import { useEffect, useState } from "react";
import TaskTracker from "../components/TaskTracker";
import SheetSelector from "../components/SheetSelector";
import { useSession, signOut } from "next-auth/react";
import AuthPrompt from '@/components/AuthPrompt';
import { getSelectedSheetId, setSelectedSheet, migrateLegacySheetStorage, type SheetProvider } from '../utils/sheet-storage';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Get current provider from session
  const currentProvider: SheetProvider = session?.provider || 'google';

  useEffect(() => {
    if (session) {
      // Migrate legacy storage on first load
      migrateLegacySheetStorage(currentProvider);
      
      // Load provider-specific sheet data
      const sheetId = getSelectedSheetId(currentProvider);
      setSelectedSheetId(sheetId);
    }
    setChecked(true);
  }, [session, currentProvider]);

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
    return <AuthPrompt />;
  }

  if (selectedSheetId) {
    return <TaskTracker key={selectedSheetId} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-12 min-w-[400px] flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-3 text-white">Select or Create a Sheet</h1>
        <p className="text-lg text-gray-400 mb-8 text-center">Choose where your tasks will be stored</p>
        <SheetSelector onSelectSheet={(sheet) => {
          setSelectedSheet(currentProvider, sheet);
          setSelectedSheetId(sheet.id);
        }} />
        <button onClick={() => signOut()} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md">
          Sign Out
        </button>
      </div>
    </div>
  );
}
