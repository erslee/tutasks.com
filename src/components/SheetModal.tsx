import React from "react";
import SheetSelector from "./SheetSelector";

export default function SheetModal({ open, onClose, onSelectSheet }: {
  open: boolean;
  onClose: () => void;
  onSelectSheet: (sheet: { id: string; name: string }) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/70 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#232428] text-white rounded-xl p-8 max-w-[420px] min-w-[340px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="mb-3 text-[#3bb0d6] text-lg font-semibold">Choose or Create a Sheet</h3>
        <SheetSelector onSelectSheet={onSelectSheet} />
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="bg-[#444] text-white border-none rounded-lg px-5 py-2 font-medium text-base cursor-pointer">Cancel</button>
        </div>
      </div>
    </div>
  );
} 
