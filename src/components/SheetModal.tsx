import React from "react";
import SheetSelector from "../app/SheetSelector";

export default function SheetModal({ open, onClose, onSelectSheet }: {
  open: boolean;
  onClose: () => void;
  onSelectSheet: (sheet: { id: string; name: string }) => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,30,30,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{ background: '#232428', color: '#fff', borderRadius: 10, padding: 32, maxWidth: 420, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.20)', minWidth: 340 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12, color: '#3bb0d6' }}>Choose or Create a Sheet</h3>
        <SheetSelector onSelectSheet={onSelectSheet} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
} 
