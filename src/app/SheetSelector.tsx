"use client";
import { useEffect, useState } from "react";

interface Sheet {
  id: string;
  name: string;
}

export default function SheetSelector({ onSelect }: { onSelect?: (sheet: Sheet) => void }) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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
    // Optionally persist selection
    localStorage.setItem("selectedSheetId", sheet.id);
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
      <button
        style={{ marginTop: 16, padding: '6px 12px', borderRadius: 4, border: '1px solid #0070f3', background: '#f0f8ff', cursor: 'pointer' }}
        onClick={() => alert('Create new sheet functionality coming soon!')}
      >
        + Create New Sheet
      </button>
    </div>
  );
} 
