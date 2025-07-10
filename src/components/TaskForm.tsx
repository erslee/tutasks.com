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
    <footer className="fixed left-0 bottom-0 w-full bg-[#232428] p-4 flex gap-3 items-center z-10">
      <input placeholder="Task Number" className="flex-none w-[120px] p-2 rounded border border-[#44474e] bg-[#323438] text-gray-200 text-base" value={number} onChange={onNumberChange} />
      <input placeholder="Task" className="flex-1 p-2 rounded border border-[#44474e] bg-[#323438] text-gray-200 text-base" value={description} onChange={onDescriptionChange} />
      <input type="date" className="flex-none w-[160px] p-2 rounded border border-[#44474e] bg-[#323438] text-gray-200 text-base" value={date} onChange={onDateChange} />
      <input placeholder="Time" className="flex-none w-[120px] p-2 rounded border border-[#44474e] bg-[#323438] text-gray-200 text-base" value={time} onChange={onTimeChange} />
      {editMode ? (
        <button className="bg-[#3bb0d6] text-white border-none rounded px-6 py-2 font-medium text-base" onClick={onUpdate} disabled={loading || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{loading ? 'Updating...' : 'Update'}</button>
      ) : (
        <button className="bg-[#44474e] text-white border-none rounded px-6 py-2 font-medium text-base" onClick={onAdd} disabled={loading || !number.trim() || !description.trim() || !date.trim() || !time.trim()}>{loading ? 'Adding...' : 'Add'}</button>
      )}
      <button className="bg-[#666a70] text-white border-none rounded px-6 py-2 font-medium text-base" onClick={onCancel}>{editMode ? 'Cancel' : 'Cancel'}</button>
      {addError && <span className="text-red-500 ml-4">{addError}</span>}
      {updateError && <span className="text-red-500 ml-4">{updateError}</span>}
    </footer>
  );
} 
