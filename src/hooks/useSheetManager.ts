import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSheetManager(redirectPath: string = "/") {
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSelectedSheetId(localStorage.getItem("selectedSheetId"));
    setSheetName(localStorage.getItem("selectedSheetName"));
  }, []);

  const handleSheetChange = (sheet: { id: string; name: string }) => {
    localStorage.setItem("selectedSheetId", sheet.id);
    localStorage.setItem("selectedSheetName", sheet.name);
    setSheetName(sheet.name);
    setSelectedSheetId(sheet.id);
    setShowSheetModal(false);
    router.replace(redirectPath);
  };

  const openSheetModal = () => setShowSheetModal(true);
  const closeSheetModal = () => setShowSheetModal(false);

  return {
    selectedSheetId,
    sheetName,
    showSheetModal,
    handleSheetChange,
    openSheetModal,
    closeSheetModal,
  };
}