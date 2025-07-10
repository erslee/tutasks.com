import React from "react";

export default function TaskForm({
  number,
  description,
  date,
  time,
  onNumberChange,
  onDescriptionChange,
  onDateChange,
  onTimeChange,
  onAdd,
  onUpdate,
  onCancel,
  editMode,
  loading,
  addError,
  updateError,
}: {
  number: string;
  description: string;
  date: string;
  time: string;
  onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  editMode: boolean;
  loading: boolean;
  addError?: string | null;
  updateError?: string | null;
}) {
  return (
    <footer style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', background: '#232428', padding: 16, display: 'flex', gap: 12, alignItems: 'center', zIndex: 10 }}>
      <input placeholder="Task Number" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={number} onChange={onNumberChange} />
      <input placeholder="Task" style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={description} onChange={onDescriptionChange} />
      <input type="date" style={{ flex: '0 0 160px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={date} onChange={onDateChange} />
      <input placeholder="Time" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={time} onChange={onTimeChange} />
      {editMode ? (
        <button style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={onUpdate} disabled={loading || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{loading ? 'Updating...' : 'Update'}</button>
      ) : (
        <button style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={onAdd} disabled={loading || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{loading ? 'Adding...' : 'Add'}</button>
      )}
      <button style={{ background: '#666a70', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={onCancel}>{editMode ? 'Cancel' : 'Cancel'}</button>
      {addError && <span style={{ color: '#e74c3c', marginLeft: 16 }}>{addError}</span>}
      {updateError && <span style={{ color: '#e74c3c', marginLeft: 16 }}>{updateError}</span>}
    </footer>
  );
} 
