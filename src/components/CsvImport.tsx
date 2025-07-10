"use client";
import { useState, useRef } from "react";

function generateUID() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CsvImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImportClick() {
    setShowImportModal(true);
    setCsvPreview([]);
    setCsvError(null);
  }

  function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setCsvError("CSV must have at least one data row");
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim());
      const headerMap: Record<string, string> = {
        taskNumber: "number",
        description: "description",
        createAt: "date",
        time: "time",
      };
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((h, i) => {
          const key = headerMap[h] || h;
          obj[key] = values[i]?.trim() ?? "";
        });
        return obj;
      });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleCsvImportConfirm() {
    setCsvError(null);
    const sheetId = localStorage.getItem("selectedSheetId");
    if (!sheetId) {
      setCsvError("No sheet selected");
      return;
    }
    const monthGroups: Record<string, any[]> = {};
    for (const row of csvPreview) {
      const dateObj = new Date(row.date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const monthSheetName = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (!monthGroups[monthSheetName]) monthGroups[monthSheetName] = [];
      monthGroups[monthSheetName].push({
        ...row,
        uid: generateUID(),
      });
    }
    try {
      for (const [monthSheetName, rows] of Object.entries(monthGroups)) {
        await fetch(`/api/sheets/get-tasks?sheetId=${encodeURIComponent(sheetId)}&monthSheetName=${encodeURIComponent(monthSheetName)}`);
        const values = rows.map(row => [row.uid, row.number, row.description, row.date, row.time]);
        const resAppend = await fetch("/api/sheets/batch-append", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, monthSheetName, values }),
        });
        const dataAppend = await resAppend.json();
        if (!resAppend.ok || !dataAppend.success) throw new Error(dataAppend.error || "Failed to add tasks");
      }
      setShowImportModal(false);
      setCsvPreview([]);
      onImportSuccess();
    } catch (err: any) {
      setCsvError(err.message || "Failed to import some tasks");
    }
  }

  return (
    <>
      <button
        className="bg-[#3bb0d6] text-white border-none rounded-lg px-4 py-2 font-medium text-base mr-4 hover:bg-[#2699bb] transition"
        onClick={handleImportClick}
      >
        Import CSV
      </button>
      {showImportModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/70 z-[1000] flex items-center justify-center" onClick={() => setShowImportModal(false)}>
          <div className="bg-[#232428] text-white rounded-xl p-8 max-w-[480px] min-w-[340px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-3 text-[#3bb0d6] text-lg font-semibold">Import Tasks from CSV</h3>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvFileChange} className="mb-4" />
            {csvError && <div className="text-red-500 mb-2">{csvError}</div>}
            {csvPreview.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#444]">
                      <th className="text-left p-1">number</th>
                      <th className="text-left p-1">description</th>
                      <th className="text-left p-1">date</th>
                      <th className="text-left p-1">time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, i) => (
                      <tr key={i} className="border-b border-[#333]">
                        <td className="p-1">{row.number}</td>
                        <td className="p-1">{row.description}</td>
                        <td className="p-1">{row.date}</td>
                        <td className="p-1">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowImportModal(false)} className="bg-[#444] text-white border-none rounded-lg px-5 py-2 font-medium text-base cursor-pointer">Cancel</button>
              <button onClick={handleCsvImportConfirm} disabled={!csvPreview.length} className="bg-[#3bb0d6] text-white border-none rounded-lg px-5 py-2 font-medium text-base cursor-pointer disabled:opacity-60">Import</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
