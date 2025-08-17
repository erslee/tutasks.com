import { useState } from "react";

export function useCalendar() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(0);
    setSelectedDay(1);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setSelectedDay(1);
  };

  const handleDaySelect = (day: number) => setSelectedDay(day);

  const handleToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  return {
    selectedYear,
    selectedMonth,
    selectedDay,
    handleYearSelect,
    handleMonthSelect,
    handleDaySelect,
    handleToday,
    today,
  };
}