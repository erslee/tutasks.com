import { signIn } from "next-auth/react";

export default function AuthPrompt() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-4 text-blue-400">TuTasks</h1>
      <pre className="text-blue-300 text-sm mb-8">
      </pre>
      <pre className="text-gray-400 text-xs mb-8">
        {`
+---------------------------------------------------------------------+
|                         Tu Tasks                                    |
+---------------------------------------------------------------------+
|  <  [  2025-07-10  ]  >                                             |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------------------------------------------------------+  |
|  | [Task Description 1]                                          |  |
|  |                                                               |  |
|  | Task Number: [TASK-001]  Created at: [2023-10-26]  Time: [08:00]||
|  |                                                [Copy] [Delete]|  |
|  +---------------------------------------------------------------+  |
|                                                                     |
|  +---------------------------------------------------------------+  |
|  | [Task Description 2]                                          |  |
|  |                                                               |  |
|  | Task Number: [TASK-002]  Created at: [2023-10-26]  Time: [09:30]||
|  |                                                [Copy] [Delete]|  |
|  +---------------------------------------------------------------+  |
|                                                                     |
|  +---------------------------------------------------------------+  |
|  | [Task Description 3]                                          |  |
|  |                                                               |  |
|  | Task Number: [TASK-003]  Created at: [2023-10-26]  Time: [11:00]||
|  |                                                [Copy] [Delete]|  |
|  +---------------------------------------------------------------+  |
|                                                                     |
|  [Loading tasks...] or [No tasks for this day.]                     |
|                                                                     |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------------------------------------------------------+  |
|  | Task Number: [____] Description: [___________________________]|  |
|  | Time: [____]  Created At: [2025/07/10]              [Add Task]|  |
|  +---------------------------------------------------------------+  |
+---------------------------------------------------------------------+
`}
      </pre>
      <p className="text-xl text-gray-300 text-center max-w-2xl mb-8">
        TuTasks is a simple yet powerful task management application that works with both Google Sheets and Microsoft Excel Online.
        It allows you to manage your tasks directly within your preferred spreadsheet platform, providing a familiar and flexible way to organize your work.
        No complex databases, just the power of your favorite spreadsheet application.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
          </svg>
          Sign in with Google Sheets
        </button>
        <button
          onClick={() => signIn("azure-ad")}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h11.377v11.372H0V0zm12.623 0H24v11.372H12.623V0zM0 12.623h11.377V24H0V12.623zm12.623 0H24V24H12.623V12.623z"/>
          </svg>
          Sign in with Microsoft Excel
        </button>
      </div>
      <a
        href="https://github.com/erslee/tutasks.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 text-lg font-medium transition duration-300 ease-in-out flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.49.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Explore on GitHub
      </a>
    </div>
  );
}
