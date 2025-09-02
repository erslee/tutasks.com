import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  getSelectedSheetId, 
  getSelectedSheetName, 
  setSelectedSheet, 
  migrateLegacySheetStorage,
  type SheetProvider 
} from "../utils/sheet-storage";

export function useSheetManager(redirectPath: string = "/") {
  const { data: session } = useSession();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const router = useRouter();

  // Get current provider from session
  const currentProvider: SheetProvider = session?.provider || 'google';

  useEffect(() => {
    if (session) {
      // Migrate legacy storage on first load
      migrateLegacySheetStorage(currentProvider);
      
      // Load provider-specific sheet data
      const sheetId = getSelectedSheetId(currentProvider);
      const sheetNameFromStorage = getSelectedSheetName(currentProvider);
      
      setSelectedSheetId(sheetId);
      setSheetName(sheetNameFromStorage);
    }
  }, [session, currentProvider]);

  const handleSheetChange = (sheet: { id: string; name: string }) => {
    if (session) {
      setSelectedSheet(currentProvider, sheet);
      setSheetName(sheet.name);
      setSelectedSheetId(sheet.id);
      setShowSheetModal(false);
      router.replace(redirectPath);
    }
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