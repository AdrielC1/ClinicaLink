# 🏥 ClinicaLink

ClinicaLink adalah sistem manajemen janji temu klinik berbasis web yang dirancang untuk mendigitalkan proses pendaftaran pasien. Sistem ini meminimalisasi penumpukan pasien di ruang tunggu dan secara mutlak mencegah bentrok jadwal dokter (*double-booking*) melalui arsitektur penjadwalan cerdas berbasis *Time-Slot*.

## 🚀 Fitur Utama

Sistem ini melayani 3 aktor utama dengan fungsionalitas yang terisolasi berdasarkan peran (Role-Based Access Control):

* **👨‍⚕️ Pasien:** Reservasi mandiri secara *real-time*, memantau jadwal aktif, membatalkan (*reschedule*), dan meninjau riwayat medis.
* **🩺 Dokter:** Memantau daftar pasien harian, melakukan sesi konsultasi, dan memberikan catatan medis (*medical notes*).
* **⚙️ Admin:** Mengelola *master data* (Dokter, Jadwal, Pasien), menyetujui proses *Check-in* fisik pasien, serta memantau statistik klinik.

## 🧠 Smart Virtual State Logic
Aplikasi ini tidak bergantung murni pada intervensi manual. Status pasien dihitung secara cerdas berbasis waktu:
* **Auto-Start:** Status otomatis menjadi "Sedang Berlangsung" ketika waktu saat ini memasuki jam pendaftaran dan admin telah melakukan "Check-in".
* **Menunggu Catatan Dokter:** Jika sesi telah melewati waktu selesai (`end_time`) namun dokter belum menginput catatan medis, sistem akan mengingatkan dokter di *dashboard*.
* **Selesai Paksa (4-Hour Rule):** Untuk menjaga integritas operasional, jika telah melewati 4 jam dari waktu selesai dan dokter tidak merespons, sistem akan secara otomatis memotong status menjadi "Selesai".

## 🛠️ Tech Stack
* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
* **Backend & API:** Next.js Server Actions
* **Database & Auth:** Supabase (PostgreSQL)
* **Deployment:** Vercel

## 👥 Tim Pengembang (Kelompok 1)
- Aisyah Apriliani Putri
- Adriel Christofer Widya
- Cornelius Fransinatra Wijaya
- Muhammad Zero One Tauhida
- Yunita Dwi Ardilasari

---
*Proyek ini dikembangkan sebagai pemenuhan tugas Rekayasa Perangkat Lunak (Deliverable D3/D4) di Universitas Diponegoro.*