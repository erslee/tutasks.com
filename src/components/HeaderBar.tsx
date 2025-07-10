import React from "react";
import Link from "next/link";
import { Session } from "next-auth";

export default function HeaderBar({ session, sheetName, onSheetClick, onSignOut }: {
  session: Session;
  sheetName: string | null;
  onSheetClick: (e: React.MouseEvent) => void;
  onSignOut: (e: React.MouseEvent) => void;
  onImportSuccess: () => void;
}) {
  console.log("HeaderBar session:", session);
  return (
    <header className="flex items-center px-6 py-4 text-3xl font-semibold">
      <span>Tu Tasks</span>
      <div className="flex-1" />
      <Link href="/statistics" className="text-gray-400 mr-4 underline text-base">Statistics</Link>
      {/* <CsvImport onImportSuccess={onImportSuccess} /> */}
      <button
        className="bg-[#44474e] text-white border-none rounded-lg px-4 py-2 font-medium text-base flex items-center gap-2"
      >
        {session?.user?.image && (
          <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full object-cover bg-[#222]" />
        )}
        {session?.user?.name && (
          <span className="text-base font-normal">
            {session.user.name}
            {sheetName && (
              <span
                className="text-gray-400 font-normal ml-2 cursor-pointer underline"
                onClick={onSheetClick}
                title="Change sheet"
              >
                [{sheetName}]
              </span>
            )}
          </span>
        )}
        <span
          className="font-semibold underline cursor-pointer ml-4"
          onClick={onSignOut}
        >Sign Out</span>
      </button>
    </header>
  );
} 
