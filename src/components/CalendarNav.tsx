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
    <section className="bg-[#232428] rounded-lg mx-4 p-4 mb-6">
      {/* Year Navigation */}
      <div className="flex overflow-x-auto gap-4 mb-2 whitespace-nowrap">
        {years.map(y => {
          const stats = getYearStats(y);
          return (
            <div
              key={y}
              onClick={() => onYearSelect(y)}
              className={
                `rounded-lg px-6 py-2 font-semibold text-lg min-w-[90px] text-center select-none cursor-pointer transition-all ` +
                (selectedYear === y
                  ? 'bg-[#44474e] text-white border-2 border-[#3bb0d6]'
                  : 'bg-[#323438] text-gray-400 border-none')
              }
            >
              {y} <span className="text-gray-400 font-normal text-base"> {stats.count} ({stats.hours})</span>
            </div>
          );
        })}
        <div
          onClick={handleToday}
          className="bg-[#3bb0d6] rounded-lg px-6 py-2 font-semibold text-lg text-white cursor-pointer min-w-[90px] text-center select-none ml-3 shadow-md"
        >
          Today
        </div>
      </div>
      {/* Month Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-2 whitespace-nowrap">
        {months.map((m, i) => {
          const stats = getMonthStats(selectedYear, i);
          return (
            <div
              key={m}
              onClick={() => onMonthSelect(i)}
              className={
                `rounded-md px-4 py-1 font-medium text-base min-w-[70px] text-left select-none cursor-pointer transition-all border ` +
                (selectedMonth === i
                  ? 'bg-[#44474e] text-white border-2 border-[#3bb0d6]'
                  : 'bg-[#232428] text-gray-400 border border-[#44474e]')
              }
            >
              {m}<br /><span className="text-xs text-gray-500">{stats.count} ({stats.hours})</span>
            </div>
          );
        })}
      </div>
      {/* Day Navigation (optional) */}
      {!hideDay && (
        <div className="flex overflow-x-auto gap-1 whitespace-nowrap">
          {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
            const day = i + 1;
            const dateObj = new Date(selectedYear, selectedMonth, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const stats = getDayStats(selectedYear, selectedMonth, day);
            return (
              <div
                key={`${selectedYear}-${selectedMonth}-${day}`}
                onClick={() => onDaySelect(day)}
                className={
                  `rounded px-2 py-1 font-medium text-base min-w-[40px] text-left select-none cursor-pointer transition-all flex flex-col items-center justify-center border ` +
                  (selectedDay === day
                    ? 'bg-[#44474e] text-white border-2 border-[#3bb0d6]'
                    : isWeekend
                      ? 'bg-[#55585e] text-gray-400 border border-[#44474e]'
                      : 'bg-[#323438] text-[#e0e0e0] border border-[#44474e]')
                }
              >
                <span className="text-base font-bold">{day}</span>
                <span className="text-xs text-gray-400 mt-1 leading-none">{stats.count} <span className="text-gray-500">({stats.hours})</span></span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
} 
