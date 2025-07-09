"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import SheetSelector from "./SheetSelector";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading authentication...</div>;
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h1>Task Tracker Login Test</h1>
      {!session ? (
        <>
          <p>You are not signed in.</p>
          <button onClick={() => signIn("google")}>Sign in with Google</button>
        </>
      ) : (
        <>
          <p>Signed in as <b>{session.user?.email}</b></p>
          {session.user?.image && (
            <img src={session.user.image} alt="User avatar" style={{ borderRadius: '50%', width: 60, height: 60, margin: 8 }} />
          )}
          <button onClick={() => signOut()}>Sign out</button>
          <SheetSelector />
        </>
      )}
    </main>
  );
}
