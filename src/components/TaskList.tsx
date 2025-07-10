import React from "react";

interface Task {
  uid?: string;
  id?: string;
  number: string;
  description: string;
  date: string;
  time: string;
}

export default function TaskList({
  tasks,
  loading,
  error,
  onTaskClick,
  onCopy,
  onDelete,
  deletingUid,
}: {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onTaskClick: (task: Task) => void;
  onCopy: (task: Task, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (task: Task, e: React.MouseEvent<HTMLButtonElement>) => void;
  deletingUid: string | null;
}) {
  const TaskPlaceholder = () => (
  <div className="bg-[#393b40] rounded-lg px-6 pt-5 pb-3 mb-5 border border-[#232428] flex flex-col shadow-md animate-pulse">
    <div className="h-6 bg-gray-500 rounded w-3/4 mb-4"></div>
    <div className="flex items-center text-base text-gray-400 gap-8 mt-2 mb-0 justify-between w-full">
      <div className="flex gap-8 items-center w-full">
        <div className="h-4 bg-gray-500 rounded w-1/4"></div>
        <div className="h-4 bg-gray-500 rounded w-1/4"></div>
        <div className="h-4 bg-gray-500 rounded w-1/4"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-gray-500 rounded"></div>
        <div className="h-8 w-20 bg-gray-500 rounded"></div>
      </div>
    </div>
  </div>
);

if (loading) {
  return (
    <div className="mt-8">
      <TaskPlaceholder />
      <TaskPlaceholder />
      <TaskPlaceholder />
    </div>
  );
}
  if (error) return <div className="text-red-500 text-lg mt-8">{error}</div>;
  if (!tasks.length) return <div className="text-gray-400 text-lg mt-8">No tasks for this day.</div>;
  return (
    <div>
      {tasks.map((task, idx) => {
        let key: string | undefined = undefined;
        if (typeof task.uid === 'string' && task.uid.length > 0) key = task.uid;
        else if (typeof task.id === 'string' && task.id.length > 0) key = task.id;
        return (
          <div key={key || ('' + idx)}
            className="bg-[#393b40] rounded-lg px-6 pt-5 pb-3 mb-5 border border-[#232428] flex flex-col shadow-md cursor-pointer"
            onClick={() => onTaskClick(task)}
          >
            <div className="text-xl font-medium text-white mb-2">{task.description}</div>
            <div className="flex items-center text-base text-gray-400 gap-8 mt-2 mb-0 justify-between w-full">
              <div className="flex gap-8 items-center">
                <span>Task Number: <span className="text-gray-400 font-medium">{task.number} <span role="img" aria-label="calendar">📅</span></span></span>
                <span>Created at: <span className="text-gray-400 font-medium">{task.date}</span></span>
                <span>time: <span className="text-gray-400 font-medium">{task.time}</span></span>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-[#3bb0d6] text-white border-none rounded px-4 py-1 font-medium text-base flex items-center gap-1"
                  onClick={e => onCopy(task, e)}
                >
                  <span role="img" aria-label="copy">📋</span>
                </button>
                <button
                  onClick={e => onDelete(task, e)}
                  disabled={deletingUid === task.uid}
                  className={`bg-red-600 text-white border-none rounded px-4 py-1 font-medium text-base ${deletingUid === task.uid ? 'opacity-60' : ''}`}
                >
                  {deletingUid === task.uid ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 
