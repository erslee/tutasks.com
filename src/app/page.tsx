"use client";
import { useEffect, useState } from "react";
import TaskTracker from "./TaskTracker";
import SheetSelector from "./SheetSelector";
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

  if (status === "loading" || !checked) {
    return <div style={{ color: '#e0e0e0', background: '#232428', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!session) {
    return (
      <div style={{ color: '#e0e0e0', background: '#232428', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 24 }}>Welcome to Tu Tasks</h1>
        <p style={{ fontSize: 18, marginBottom: 32 }}>Sign in with Google to get started</p>
        <button onClick={() => signIn("google")}
          style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontWeight: 600, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (selectedSheetId) {
    if (sheetLoading) {
      return <div style={{ color: '#e0e0e0', background: '#232428', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>Loading sheet...</div>;
    }
    return <TaskTracker key={selectedSheetId} />;
  }

  return (
    <div style={{ background: '#232428', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#323438', borderRadius: 12, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)', padding: '48px 40px', minWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Select or Create a Sheet</h1>
        <p style={{ fontSize: 18, color: '#b0b0b0', marginBottom: 32 }}>Choose where your tasks will be stored</p>
        <SheetSelector onSelectSheet={() => setSelectedSheetId(localStorage.getItem("selectedSheetId"))} />
        <button onClick={() => signOut()} style={{ marginTop: 32, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Sign Out</button>
      </div>
    </div>
  );
}
