"use client";
import { useEffect, useState } from "react";

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

  function handleSelect(sheet: Sheet) {
    setSelected(sheet.id);
    if (onSelect) onSelect(sheet);
    if (onSelectSheet) onSelectSheet(sheet);
    // Optionally persist selection
    localStorage.setItem("selectedSheetId", sheet.id);
    localStorage.setItem("selectedSheetName", sheet.name);
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
    <div style={{ marginTop: 32, maxWidth: 400 }}>
      <h2>Select a Google Sheet</h2>
      {loading && <p>Loading sheets...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sheets.map(sheet => (
            <li key={sheet.id} style={{ margin: '8px 0' }}>
              <button
                style={{
                  fontWeight: selected === sheet.id ? 'bold' : 'normal',
                  background: selected === sheet.id ? '#e0e0e0' : 'white',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
                onClick={() => handleSelect(sheet)}
              >
                {sheet.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 16 }}>
        <input
          type="text"
          placeholder="Sheet name"
          value={sheetName}
          onChange={e => setSheetName(e.target.value)}
          style={{ padding: '6px', borderRadius: 4, border: '1px solid #ccc', marginRight: 8, width: 180 }}
          disabled={creating}
        />
        <button
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #0070f3', background: '#f0f8ff', cursor: 'pointer' }}
          onClick={handleCreate}
          disabled={creating || !sheetName.trim()}
        >
          {creating ? 'Creating...' : '+ Create New Sheet'}
        </button>
      </div>
      {createError && <p style={{ color: 'red' }}>{createError}</p>}
    </div>
  );
} 
