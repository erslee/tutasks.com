"use client";
import PageLayout from "../../components/PageLayout";
import CopyButton from "../../components/CopyButton";
import { useCalendar } from "../../hooks/useCalendar";
import { useSheetManager } from "../../hooks/useSheetManager";
import { useTasks } from "../../hooks/useTasks";
import type { Task } from "../../types/task";

export default function StatisticsPage() {
  const calendar = useCalendar();
  const sheetManager = useSheetManager("/statistics");
  const { allTasks, loadingTasks, tasksError, fetchAllTasks } = useTasks(sheetManager.selectedSheetId);



  const grouped = allTasks.reduce((acc: Record<string, Task[]>, task) => {
    const date = new Date(task.date);

    if (date.getFullYear() !== calendar.selectedYear || date.getMonth() !== calendar.selectedMonth) {
      return acc; // Skip tasks not in the selected year/month
    }

    const number = task.number || "0";
    if (!acc[number]) {
      acc[number] = [];
    }
    acc[number].push(task);
    return acc;
  }, {});

  const totalTime = Object.values(grouped).reduce((sum, group) => {
    return sum + group.reduce((groupSum, task) => groupSum + (parseFloat(task.time) || 0), 0);
  }, 0).toFixed(2);

  return (
    <PageLayout
      allTasks={allTasks}
      sheetName={sheetManager.sheetName}
      showSheetModal={sheetManager.showSheetModal}
      selectedYear={calendar.selectedYear}
      selectedMonth={calendar.selectedMonth}
      selectedDay={calendar.selectedDay}
      onSheetClick={e => { e.stopPropagation(); sheetManager.openSheetModal(); }}
      onSheetSelect={sheetManager.handleSheetChange}
      onCloseSheetModal={sheetManager.closeSheetModal}
      onYearSelect={calendar.handleYearSelect}
      onMonthSelect={calendar.handleMonthSelect}
      onDaySelect={calendar.handleDaySelect}
      onToday={calendar.handleToday}
      onImportSuccess={fetchAllTasks}
      hideDay={true}
    >
      <h2 className="font-medium text-2xl mt-8 mb-4 ml-8 text-[#e0e0e0]">Statistics</h2>
      <div className="mx-4 bg-[#18191c] rounded-lg p-6 shadow-xl">
        <table className="w-full border-collapse text-[#e0e0e0]">
          <thead>
            <tr className="border-b-2 border-[#444]">
              <th className="text-left p-2">Task</th>
              <th className="text-left p-2">Sub Tasks</th>
              <th className="text-left p-2">Date</th>
              <th className="text-right p-2">Total Time</th>
              <th className="text-center p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([number, group]) => (
              group.map((task, idx) => (
                <tr key={task.uid || task.id || idx} className="border-b border-[#333]">
                  {idx === 0 && (
                    <td rowSpan={group.length} className="align-top font-semibold p-2">{number}</td>
                  )}
                  <td className="p-2">{task.description || '-'}</td>
                  <td className="p-2">{task.date}</td>
                  {idx === 0 && (
                    <td rowSpan={group.length} className="text-right font-semibold p-2">
                      {group.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0)}
                    </td>
                  )}
                  <td className="text-center p-2">
                    <CopyButton task={task} size="sm" />
                  </td>
                </tr>
              ))
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-bold p-2">Total Time</td>
              <td className="text-right font-bold p-2">{totalTime}</td>
            </tr>
          </tfoot>
        </table>
        {loadingTasks && (
          <div className="mt-8">
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-[#393b40] rounded-lg mb-3"></div>
              ))}
            </div>
          </div>
        )}
        {tasksError && <div className="text-red-500 text-lg mt-8">{tasksError}</div>}
      </div>
    </PageLayout>
  );
}
