"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DoctorDashboardPage() {
  const doctorName = "Emily"; // Placeholder, can be made dynamic later

  // Calendar Logic (Simplified for UI display)
  const today = new Date();
  const year = 2030; // Matches screenshot: Mei 2030
  const month = 4; // May
  
  // Dummy Calendar Days
  const calendarDays = [
    { day: 28, muted: true }, { day: 29, muted: true }, { day: 30, muted: true },
    { day: 1, muted: false }, { day: 2, muted: false }, { day: 3, muted: false }, { day: 4, muted: false },
    { day: 5, muted: false }, { day: 6, muted: false }, { day: 7, muted: false }, { day: 8, muted: false }, { day: 9, muted: false }, { day: 10, muted: false }, { day: 11, muted: false },
    { day: 12, muted: false, active: true }, { day: 13, muted: false }, { day: 14, muted: false }, { day: 15, muted: false }, { day: 16, muted: false }, { day: 17, muted: false }, { day: 18, muted: false },
    { day: 19, muted: false }, { day: 20, muted: false }, { day: 21, muted: false }, { day: 22, muted: false }, { day: 23, muted: false }, { day: 24, muted: false }, { day: 25, muted: false },
    { day: 26, muted: false }, { day: 27, muted: false }, { day: 28, muted: false }, { day: 29, muted: false }, { day: 30, muted: false }, { day: 31, muted: false }, { day: 1, muted: true }
  ];
  
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  // Dummy Schedule
  const scheduleList = [
    { id: 1, time: "10.00", name: "Kimmy", keluhan: "Sakit Gigi", status: "Selesai", actionText: "Selesai", btnStyle: "bg-[#e2e8f0] text-gray-700" },
    { id: 2, time: "13.00", name: "Mila", keluhan: "Tambal Gigi", status: "Menunggu", actionText: "Mulai", btnStyle: "border border-[#5E81CC] text-[#5E81CC]" },
    { id: 3, time: "14.30", name: "Sila", keluhan: "Behel Konsultasi", status: "Menunggu", actionText: "Mulai", btnStyle: "border border-[#5E81CC] text-[#5E81CC]" },
  ];

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
      
      {/* Main Content Area */}
      <main className="min-w-0">
        <h1 className="text-[23px] font-extrabold tracking-[-0.01em]">Halo, Dr {doctorName}</h1>
        <p className="mt-2 text-[15px] text-gray-500 font-medium">
          Berikut ringkasan jadwal dan pasien hari ini.
        </p>

        <section className="mt-8 rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="text-[16px] font-extrabold text-gray-900">Jadwal hari ini</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] text-gray-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Keluhan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scheduleList.map((item) => (
                  <tr key={item.id} className="font-bold text-gray-800">
                    <td className="px-6 py-4">{item.time}</td>
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4">{item.keluhan}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-extrabold ${item.status === 'Selesai' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fef9c3] text-[#ca8a04]'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className={`h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold transition-colors ${item.btnStyle}`}>
                        {item.actionText}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Dummy */}
          <div className="flex items-center justify-center gap-2 py-6 text-[13px] font-bold text-gray-500">
            <button className="p-1 text-gray-400 hover:text-gray-700"><ChevronLeft size={16}/></button>
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5E81CC] text-white">1</button>
            <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100">2</button>
            <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100">3</button>
            <button className="p-1 text-gray-400 hover:text-gray-700"><ChevronRight size={16}/></button>
          </div>
        </section>
      </main>

      {/* Right Sidebar Area */}
      <aside className="space-y-6">
        {/* Calendar Widget */}
        <section className="bg-white px-6 py-7 sm:px-8 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <button type="button" aria-label="Bulan sebelumnya" className="shrink-0 p-1"><ChevronLeft size={18} /></button>
            <p className="min-w-0 truncate text-[12px] font-extrabold">Mei 2030</p>
            <button type="button" aria-label="Bulan berikutnya" className="shrink-0 p-1"><ChevronRight size={18} /></button>
          </div>

          <div className="mt-7 grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-gray-800">
            {weekdays.map((day) => (<span key={day}>{day}</span>))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-y-5 text-center text-[11px] font-extrabold text-gray-800">
            {calendarDays.map((date, index) => {
              return (
                <span
                  key={`${date.day}-${index}`}
                  className={`mx-auto flex h-[24px] w-[24px] items-center justify-center rounded-full ${date.active ? "bg-[#dce6ff] text-[#5E81CC]" : date.muted ? "text-[#b9bec7] font-medium" : ""}`}
                >
                  {date.day}
                </span>
              );
            })}
          </div>

          <div className="mt-8 border-t border-[#f1f5f9] pt-6">
            <h3 className="text-[13px] font-extrabold text-gray-900">Jadwal Hari ini</h3>
            <div className="mt-5 flex items-center justify-between gap-4 text-[12px] font-extrabold text-gray-800">
              <span>10.00 - 10.30</span>
              <span>Kimmy</span>
            </div>
            <button type="button" className="mt-6 text-[12px] font-extrabold text-[#5E81CC] hover:underline">
              Lihat Semua
            </button>
          </div>
        </section>
      </aside>

    </div>
  );
}
