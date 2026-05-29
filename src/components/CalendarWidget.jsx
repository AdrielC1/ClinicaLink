"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const WEEKDAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * Reusable Calendar Widget for Patient, Doctor, and Admin Dashboards
 * 
 * @param {Date} currentMonth - The current month being viewed (used for rendering month grid)
 * @param {Function} onChangeMonth - (delta) => void, triggers month change
 * @param {string} selectedDate - ISO date string "YYYY-MM-DD" of the currently selected date
 * @param {Function} onSelectDate - (isoDateString) => void, triggers when a date is clicked
 * @param {string[]} eventDates - Array of ISO date strings that have events (e.g. appointments)
 */
export default function CalendarWidget({
  currentMonth,
  onChangeMonth,
  selectedDate,
  onSelectDate,
  eventDates = []
}) {
  
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay(); 
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    // Padding prev month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({ date: d, isCurrentMonth: false, type: 'prev' });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      cells.push({ date: d, isCurrentMonth: true, type: 'curr' });
    }
    
    // Padding next month
    const remainingDays = 42 - cells.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, isCurrentMonth: false, type: 'next' });
    }
    
    return cells;
  }, [currentMonth]);

  const handleCellClick = (cell) => {
    // UX Enhancement: If clicking a date from a previous or next month, 
    // automatically change the calendar month to that month before selecting.
    if (!cell.isCurrentMonth) {
      if (cell.type === 'prev') {
        onChangeMonth(-1);
      } else if (cell.type === 'next') {
        onChangeMonth(1);
      }
    }
    
    const y = cell.date.getFullYear();
    const m = String(cell.date.getMonth() + 1).padStart(2, '0');
    const d = String(cell.date.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
  };

  return (
    <div className="overflow-hidden rounded-3xl shadow-sm bg-white border border-gray-100 transition-all duration-300">
      {/* Header Kalender */}
      <div className="bg-[#5E81CC] px-5 pt-3 pb-1">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => onChangeMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-[14px] font-extrabold text-white tracking-wide">
            {MONTHS_ID[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => onChangeMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        {/* Nama hari */}
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS_SHORT.map((d) => (
            <span key={d} className="text-[11px] font-bold text-blue-100 tracking-wider py-1">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Grid Tanggal */}
      <div className="bg-white px-4 pb-4 pt-3 relative overflow-hidden">
        <div className="grid grid-cols-7 gap-y-1">
          {calendarCells.map((cell, index) => {
            const y = cell.date.getFullYear();
            const m = String(cell.date.getMonth() + 1).padStart(2, '0');
            const dStr = String(cell.date.getDate()).padStart(2, '0');
            const dateISO = `${y}-${m}-${dStr}`;

            const todayISO = (() => {
              const t = new Date();
              return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
            })();
            
            const isSelected = selectedDate === dateISO;
            const isToday = todayISO === dateISO;
            const hasEvent = eventDates.includes(dateISO);

            return (
              <div key={index} className="flex flex-col items-center py-[2px]">
                <button
                  type="button"
                  onClick={() => handleCellClick(cell)}
                  className={[
                    "relative w-8 h-8 flex items-center justify-center rounded-xl text-[12px] font-bold transition-all duration-150 select-none cursor-pointer",
                    isSelected
                      ? "bg-[#5E81CC] text-white shadow-md shadow-[#5E81CC]/30 scale-105 font-extrabold"
                      : isToday
                        ? "bg-[#EEF3FF] text-[#5E81CC] font-extrabold ring-2 ring-[#5E81CC] ring-offset-1"
                        : cell.isCurrentMonth
                          ? "text-gray-700 hover:bg-indigo-50 hover:text-[#5E81CC]"
                          : "text-gray-300 hover:bg-gray-50 hover:text-gray-400"
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                  {/* Titik appointment di sudut kanan atas */}
                  {hasEvent && !isSelected && (
                    <span className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#5E81CC] shadow-sm" />
                  )}
                  {hasEvent && isSelected && (
                    <span className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-white/80" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
