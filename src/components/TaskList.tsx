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
  if (loading) return <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>Loading tasks...</div>;
  if (error) return <div style={{ color: '#e74c3c', fontSize: 18, marginTop: 32 }}>{error}</div>;
  if (!tasks.length) return <div style={{ color: '#b0b0b0', fontSize: 18, marginTop: 32 }}>No tasks for this day.</div>;
  return (
    <div>
      {tasks.map((task, idx) => {
        let key: string | undefined = undefined;
        if (typeof task.uid === 'string' && task.uid.length > 0) key = task.uid;
        else if (typeof task.id === 'string' && task.id.length > 0) key = task.id;
        return (
          <div key={key || ('' + idx)} style={{
            background: '#393b40',
            borderRadius: 8,
            padding: '18px 24px 12px 24px',
            marginBottom: 18,
            border: '1px solid #232428',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }} onClick={() => onTaskClick(task)}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 8 }}>
              {task.description}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 15,
              color: '#b0b0b0',
              gap: 32,
              marginBottom: 0,
              marginTop: 8,
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                <span>Task Number: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.number} <span role="img" aria-label="calendar">📅</span></span></span>
                <span>Created at: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.date}</span></span>
                <span>time: <span style={{ color: '#b0b0b0', fontWeight: 500 }}>{task.time}</span></span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={e => onCopy(task, e)}
                >
                  <span role="img" aria-label="copy">📋</span>
                </button>
                <button
                  onClick={e => onDelete(task, e)}
                  disabled={deletingUid === task.uid}
                  style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, opacity: deletingUid === task.uid ? 0.6 : 1 }}
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
