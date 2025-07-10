import React from "react";

export default function CalendarNav({
  years,
  months,
  selectedYear,
  selectedMonth,
  selectedDay,
  onYearSelect,
  onMonthSelect,
  onDaySelect,
  handleToday,
  getYearStats,
  getMonthStats,
  getDayStats,
  hideDay = false,
}: {
  years: number[];
  months: string[];
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  onYearSelect: (year: number) => void;
  onMonthSelect: (month: number) => void;
  onDaySelect: (day: number) => void;
  handleToday: () => void;
  getYearStats: (year: number) => { count: number; hours: number };
  getMonthStats: (year: number, month: number) => { count: number; hours: number };
  getDayStats: (year: number, month: number, day: number) => { count: number; hours: number };
  hideDay?: boolean;
}) {
  function getDaysInMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }
  return (
    <section style={{ background: '#232428', borderRadius: 8, margin: '0 16px', padding: 16, marginBottom: 24 }}>
      {/* Year Navigation */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 16, marginBottom: 8, whiteSpace: 'nowrap' }}>
        {years.map(y => {
          const stats = getYearStats(y);
          return (
            <div
              key={y}
              onClick={() => onYearSelect(y)}
              style={{
                background: selectedYear === y ? '#44474e' : '#323438',
                borderRadius: 6,
                padding: '8px 24px',
                fontWeight: 600,
                fontSize: 18,
                color: selectedYear === y ? '#fff' : '#b0b0b0',
                cursor: 'pointer',
                border: selectedYear === y ? '2px solid #3bb0d6' : 'none',
                transition: 'all 0.15s',
                minWidth: 90,
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              {y} <span style={{ color: '#b0b0b0', fontWeight: 400, fontSize: 15 }}> {stats.count} ({stats.hours})</span>
            </div>
          );
        })}
        <div
          onClick={handleToday}
          style={{
            background: '#3bb0d6',
            borderRadius: 6,
            padding: '8px 24px',
            fontWeight: 600,
            fontSize: 18,
            color: '#fff',
            cursor: 'pointer',
            minWidth: 90,
            textAlign: 'center',
            userSelect: 'none',
            marginLeft: 12,
            boxShadow: '0 2px 8px 0 rgba(59,176,214,0.10)'
          }}
        >
          Today
        </div>
      </div>
      {/* Month Navigation */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 8, whiteSpace: 'nowrap' }}>
        {months.map((m, i) => {
          const stats = getMonthStats(selectedYear, i);
          return (
            <div
              key={m}
              onClick={() => onMonthSelect(i)}
              style={{
                background: selectedMonth === i ? '#44474e' : '#232428',
                borderRadius: 4,
                padding: '4px 16px',
                fontWeight: 500,
                fontSize: 15,
                color: selectedMonth === i ? '#fff' : '#b0b0b0',
                border: selectedMonth === i ? '2px solid #3bb0d6' : '1px solid #44474e',
                margin: '0 1px',
                cursor: 'pointer',
                minWidth: 70,
                textAlign: 'left',
                userSelect: 'none',
                transition: 'all 0.15s',
              }}
            >
              {m}<br /><span style={{ fontSize: 12, color: '#888' }}>{stats.count} ({stats.hours})</span>
            </div>
          );
        })}
      </div>
      {/* Day Navigation (optional) */}
      {!hideDay && (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 2, whiteSpace: 'nowrap' }}>
          {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
            const day = i + 1;
            const dateObj = new Date(selectedYear, selectedMonth, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const stats = getDayStats(selectedYear, selectedMonth, day);
            return (
              <div
                key={`${selectedYear}-${selectedMonth}-${day}`}
                onClick={() => onDaySelect(day)}
                style={{
                  background: selectedDay === day
                    ? '#44474e'
                    : isWeekend
                      ? '#55585e'
                      : '#323438',
                  color: selectedDay === day
                    ? '#fff'
                    : isWeekend
                      ? '#b0b0b0'
                      : '#e0e0e0',
                  borderRadius: 3,
                  padding: '4px 8px',
                  fontWeight: 500,
                  fontSize: 15,
                  border: selectedDay === day ? '2px solid #3bb0d6' : '1px solid #44474e',
                  margin: '0 1px',
                  cursor: 'pointer',
                  minWidth: 40,
                  textAlign: 'left',
                  userSelect: 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600 }}>{day}</span>
                <span style={{ fontSize: 11, color: '#b0b0b0', marginTop: 2, lineHeight: 1 }}>{stats.count} <span style={{ color: '#888' }}>({stats.hours})</span></span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
} 
