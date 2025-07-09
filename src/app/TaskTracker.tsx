"use client";
import { useState } from "react";

interface Task {
  id: string;
  number: string;
  description: string;
  date: string;
  time: string;
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleAdd() {
    if (!number.trim() || !description.trim() || !date.trim() || !time.trim()) return;
    setTasks(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        number,
        description,
        date,
        time,
      },
    ]);
    setNumber("");
    setDescription("");
    setDate("");
    setTime("");
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ background: '#323438', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', padding: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', fontSize: 32, fontWeight: 600 }}>
        <span>Tu Tasks</span>
        <div style={{ flex: 1 }} />
        <a href="#" style={{ color: '#b0b0b0', marginRight: 16, textDecoration: 'underline', fontSize: 16 }}>Statistic</a>
        <button style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16 }}>Sign Out (Vlad P)</button>
      </header>
      <section style={{ background: '#232428', borderRadius: 8, margin: '0 16px', padding: 16, marginBottom: 24 }}>
        {/* Calendar Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ background: '#323438', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 18 }}>2024 <span style={{ color: '#b0b0b0', fontWeight: 400 }}>(86/326)</span></div>
          <div style={{ background: '#323438', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 18 }}>2025 <span style={{ color: '#b0b0b0', fontWeight: 400 }}>(288/1046)</span></div>
          <div style={{ background: '#323438', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 18 }}>Today</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
            <div key={m} style={{ background: '#232428', borderRadius: 4, padding: '4px 10px', fontWeight: 500, fontSize: 15, color: '#b0b0b0', border: '1px solid #44474e', margin: '0 1px' }}>{m}<br /><span style={{ fontSize: 12, color: '#888' }}>{Math.floor(Math.random()*60)+30} ({Math.floor(Math.random()*180)+150})</span></div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{ background: i===4||i===11||i===18 ? '#232428' : '#323438', color: i===4||i===11||i===18 ? '#e74c3c' : '#e0e0e0', borderRadius: 3, padding: '2px 10px', fontWeight: 500, fontSize: 15, border: '1px solid #44474e', margin: '0 1px' }}>{i+1}<br /><span style={{ fontSize: 11, color: '#888' }}>{Math.floor(Math.random()*5)+1} ({Math.floor(Math.random()*10)+5})</span></div>
          ))}
        </div>
      </section>
      <section style={{ margin: '0 32px', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 500, fontSize: 26, margin: '32px 0 16px 0', color: '#e0e0e0' }}>Task List</h2>
        {tasks.map(task => (
          <div key={task.id} style={{
            background: '#393b40',
            borderRadius: 8,
            padding: '18px 24px 12px 24px',
            marginBottom: 18,
            border: '1px solid #232428',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
          }}>
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
                <button style={{ background: '#3bb0d6', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span role="img" aria-label="calendar">📅</span>
                </button>
                <button onClick={() => handleDelete(task.id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15 }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </section>
      <footer style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', background: '#232428', padding: 16, display: 'flex', gap: 12, alignItems: 'center', zIndex: 10 }}>
        <input placeholder="Task Number" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={number} onChange={e => setNumber(e.target.value)} />
        <input placeholder="Task" style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" style={{ flex: '0 0 160px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={date} onChange={e => setDate(e.target.value)} />
        <input placeholder="Time" style={{ flex: '0 0 120px', padding: 8, borderRadius: 4, border: '1px solid #44474e', background: '#323438', color: '#e0e0e0', fontSize: 16 }} value={time} onChange={e => setTime(e.target.value)} />
        <button style={{ background: '#44474e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={handleAdd}>Add</button>
        <button style={{ background: '#666a70', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, fontSize: 16 }} onClick={() => { setNumber(""); setDescription(""); setDate(""); setTime(""); }}>Cancel</button>
      </footer>
    </div>
  );
} 
