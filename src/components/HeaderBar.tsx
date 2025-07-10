import React from "react";
import Link from "next/link";

export default function HeaderBar({ session, sheetName, onSheetClick, onSignOut }: {
  session: any;
  sheetName: string | null;
  onSheetClick: (e: React.MouseEvent) => void;
  onSignOut: (e: React.MouseEvent) => void;
}) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', fontSize: 32, fontWeight: 600 }}>
      <span><Link href="/">Tu Tasks</Link></span>
      <div style={{ flex: 1 }} />
      <Link href="/statistics" style={{ color: '#b0b0b0', marginRight: 16, textDecoration: 'underline', fontSize: 16 }}>Statistics</Link>
      <button
        style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}
      >
        {session?.user?.image && (
          <img src={session.user.image} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
        )}
        {session?.user?.name && (
          <span style={{ fontSize: 16, fontWeight: 400 }}>
            {session.user.name}
            {sheetName && (
              <span
                style={{ color: '#b0b0b0', fontWeight: 400, marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={onSheetClick}
                title="Change sheet"
              >
                [{sheetName}]
              </span>
            )}
          </span>
        )}
        <span
          style={{ fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', marginLeft: 16 }}
          onClick={onSignOut}
        >Sign Out</span>
      </button>
    </header>
  );
} 
