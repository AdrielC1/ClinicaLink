# 🏥 ClinicaLink

ClinicaLink adalah sistem manajemen janji temu klinik berbasis web yang dirancang untuk mendigitalkan proses pendaftaran pasien. Sistem ini meminimalisasi penumpukan pasien di ruang tunggu dan secara mutlak mencegah bentrok jadwal dokter (*double-booking*) melalui arsitektur penjadwalan cerdas berbasis *Time-Slot*.

## 🚀 Fitur Utama

Sistem ini melayani 3 aktor utama dengan fungsionalitas yang terisolasi berdasarkan peran (Role-Based Access Control):

* **👨‍⚕️ Pasien:** Reservasi mandiri secara *real-time*, memantau jadwal aktif, membatalkan (*reschedule*), dan meninjau riwayat medis.
* **🩺 Dokter:** Memantau daftar pasien harian, memulai sesi konsultasi, dan menginput catatan medis (*medical notes*).
* **⚙️ Admin:** Mengelola *master data* (Dokter, Jadwal, Pasien), menjadwalkan penonaktifan dokter dengan *Bulk Resolution* otomatis (membatalkan janji terdampak & notifikasi pasien), serta memantau statistik operasional klinik.

## 🧠 Hybrid Virtual State Logic
Aplikasi ini menggunakan kombinasi pemicu manual dari dokter dan perhitungan waktu otomatis (Virtual State) untuk mengelola antrean secara cerdas:
* **Batal Otomatis (No-Show):** Jika jam janji temu telah terlewati namun dokter tidak pernah memulai sesi, sistem secara otomatis menganggap sesi tersebut hangus dan mengubah statusnya menjadi "Dibatalkan".
* **Sesi Interaktif:** Dokter memegang kendali penuh untuk memulai sesi dengan menekan tombol "Mulai", yang langsung mengubah status pasien menjadi "Sedang Berlangsung".
* **Menunggu Catatan Dokter:** Jika sesi telah melewati batas waktu selesai (`end_time`) namun dokter belum menginput catatan medis, sistem akan memberikan peringatan visual di *dashboard* dokter.
* **Selesai Paksa (4-Hour Rule):** Untuk menjaga integritas data harian, jika telah melewati 4 jam dari waktu selesai dan dokter tetap tidak merespons/menyimpan catatan, sistem akan secara otomatis memaksa status menjadi "Selesai".

## 🗓️ Smart Schedule "Weekly Refresh" Mechanism
Perubahan dan penghapusan jadwal dokter menggunakan mekanisme berbasis waktu (*time-versioning*) alih-alih penghapusan langsung:
* **Tambah Jadwal Baru:** Jadwal yang baru ditambahkan Admin **TIDAK langsung aktif**. Jadwal baru di-insert dengan `effective_from = Senin minggu depan`, sehingga pasien dapat terus memesan slot di minggu berjalan tanpa gangguan.
* **Hapus Jadwal:** Menghapus jadwal **TIDAK** menghapus baris dari database. Sistem hanya meng-update `effective_until` menjadi hari Minggu di minggu berjalan. Jadwal tetap tersedia untuk booking pasien hingga hari Minggu, dan otomatis tidak muncul mulai hari Senin berikutnya.
* **Tabel `doctor_schedules`** menggunakan kolom `effective_from` dan `effective_until` untuk versioning, dan **tidak menggunakan `deleted_at`**.

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