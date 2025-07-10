"use client";
import { useEffect, useState } from "react";
import React from "react";

interface Sheet {
  id: string;
  name: string;
}

export default function SheetSelector({ onSelect, onSelectSheet }: { onSelect?: (sheet: Sheet) => void, onSelectSheet?: (sheet: Sheet) => void }) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingSheet, setPendingSheet] = useState<Sheet | null>(null);
  const [checking, setChecking] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/sheets/list", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setSheets(data.sheets || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load sheets");
        setLoading(false);
      });
  }, []);

  async function checkIdentifier(sheet: Sheet) {
    setChecking(true);
    setIdentifierError(null);
    try {
      const res = await fetch(`/api/sheets/check-identifier?sheetId=${sheet.id}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        if (data.hasIdentifier) {
          // Proceed as normal
          if (onSelect) onSelect(sheet);
          if (onSelectSheet) onSelectSheet(sheet);
          localStorage.setItem("selectedSheetId", sheet.id);
          localStorage.setItem("selectedSheetName", sheet.name);
        } else {
          setPendingSheet(sheet);
          setShowModal(true);
        }
      } else {
        setIdentifierError(data.error || "Failed to check sheet");
      }
    } catch (err: any) {
      setIdentifierError(err.message || "Failed to check sheet");
    } finally {
      setChecking(false);
    }
  }

  function handleSelect(sheet: Sheet) {
    setSelected(sheet.id);
    checkIdentifier(sheet);
  }

  function handleApprove() {
    if (pendingSheet) {
      if (onSelect) onSelect(pendingSheet);
      if (onSelectSheet) onSelectSheet(pendingSheet);
      localStorage.setItem("selectedSheetId", pendingSheet.id);
      localStorage.setItem("selectedSheetName", pendingSheet.name);
      setShowModal(false);
      setPendingSheet(null);
    }
  }

  function handleCancel() {
    setShowModal(false);
    setPendingSheet(null);
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/sheets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sheetName }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      const newSheet = { id: data.id, name: data.name };
      setSheets(prev => [...prev, newSheet]);
      handleSelect(newSheet);
      setSheetName("");
    } catch (err: any) {
      setCreateError(err.message || "Failed to create sheet");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ marginTop: 16, maxWidth: 320 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Select a Google Sheet</h2>
      {loading && <p>Loading sheets...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto', border: '1px solid #333', borderRadius: 6, background: '#232428' }}>
          {sheets.map(sheet => (
            <li key={sheet.id} style={{ margin: 0 }}>
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                  fontWeight: selected === sheet.id ? 'bold' : 'normal',
                  background: selected === sheet.id ? '#3bb0d6' : 'transparent',
                  color: selected === sheet.id ? '#fff' : '#e0e0e0',
                  border: 'none',
                  borderBottom: '1px solid #333',
                  borderRadius: 0,
                  padding: '7px 10px',
                  cursor: 'pointer',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'background 0.15s',
                  minHeight: 32,
                }}
                onClick={() => handleSelect(sheet)}
              >
                <span style={{ fontSize: 18, opacity: 0.85, display: 'flex', alignItems: 'center' }}>
                  {/* Sheet SVG icon */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
                    <rect x="3" y="3" width="14" height="14" rx="2" fill={selected === sheet.id ? '#fff' : '#b0b0b0'} fillOpacity="0.18" stroke={selected === sheet.id ? '#fff' : '#b0b0b0'} strokeWidth="1.2" />
                    <rect x="6" y="7" width="8" height="1.2" rx="0.6" fill={selected === sheet.id ? '#fff' : '#b0b0b0'} />
                    <rect x="6" y="10" width="5" height="1.2" rx="0.6" fill={selected === sheet.id ? '#fff' : '#b0b0b0'} />
                  </svg>
                </span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sheet.name}</span>
              </button>
            </li>
          ))}
          {sheets.length === 0 && <li style={{ color: '#b0b0b0', padding: '10px 14px' }}>No sheets found</li>}
        </ul>
      )}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Sheet name"
          value={sheetName}
          onChange={e => setSheetName(e.target.value)}
          style={{ padding: '6px', borderRadius: 4, border: '1px solid #333', width: 140, background: '#18191c', color: '#e0e0e0', fontSize: 15 }}
          disabled={creating}
        />
        <button
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #3bb0d6', background: '#232428', color: '#3bb0d6', cursor: 'pointer', fontWeight: 500, fontSize: 15 }}
          onClick={handleCreate}
          disabled={creating || !sheetName.trim()}
        >
          {creating ? 'Creating...' : '+ New Sheet'}
        </button>
      </div>
      {createError && <p style={{ color: 'red' }}>{createError}</p>}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,30,30,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => { setShowModal(false); setPendingSheet(null); }}
        >
          <div
            style={{ background: '#232428', color: '#fff', borderRadius: 10, padding: 32, maxWidth: 400, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.20)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12, color: '#ffb300' }}>Warning: Unrecognized Sheet</h3>
            <p style={{ marginBottom: 16 }}>
              This sheet was not created by TuTasks. Some features may not work as expected, and data could be lost or misformatted.<br /><br />
              Are you sure you want to proceed with this sheet?
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={handleCancel} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleApprove} style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Proceed Anyway</button>
            </div>
          </div>
        </div>
      )}
      {identifierError && <p style={{ color: 'red' }}>{identifierError}</p>}
    </div>
  );
} 
